import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistance, verifyGeofence } from "@/lib/geo";
import { validateDynamicQRToken } from "@/lib/qr";
import { verifyFaceLiveness } from "@/lib/liveness";
import { EventType, VerificationMethod, GeofenceStatus, EventStatus, AttendanceStatus, RiskType, RiskSeverity } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse("Vui lòng đăng nhập để thực hiện chấm công.");
    }
    const currentEmployeeId = session.employee.id;

    const body = await req.json();
    const {
      latitude,
      longitude,
      accuracyMeters,
      qrToken,
      stationCode,
      faceVerificationPayload,
      webAuthnAssertion,
      deviceId,
      force,
      strictMode = false,
    } = body;

    const serverNow = new Date();
    const todayDate = new Date(Date.UTC(serverNow.getFullYear(), serverNow.getMonth(), serverNow.getDate()));

    // 1. Check account active status
    if (session.user.status !== "ACTIVE" || session.employee.employmentStatus === "TERMINATED" || session.employee.employmentStatus === "RESIGNED") {
      return NextResponse.json(
        { success: false, error: "Tài khoản nhân viên không ở trạng thái hoạt động." },
        { status: 403 }
      );
    }

    // 2. Check existing check-in today
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: currentEmployeeId,
        date: todayDate,
      },
    });

    if (existingSession && existingSession.checkInTime && !force) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã thực hiện chấm công vào ca hôm nay lúc ${new Date(existingSession.checkInTime).toLocaleTimeString("vi-VN")}. Chọn "Chấm công lại" nếu muốn cập nhật giờ vào mới.`,
          session: existingSession,
          canReset: true,
        },
        { status: 400 }
      );
    }

    // 3. Find shift assignment for today
    const assignment = await prisma.scheduleAssignment.findFirst({
      where: {
        employeeId: currentEmployeeId,
        workDate: todayDate,
      },
      include: { shift: true },
    });

    let shift: any = assignment?.shift;
    if (!shift) {
      shift = await prisma.shift.findFirst({
        where: { orgId: session.orgId, type: "ADMINISTRATIVE" },
      });
    }

    if (!shift) {
      return NextResponse.json(
        { success: false, error: "Hệ thống không tìm thấy ca làm việc khả dụng hôm nay cho bạn." },
        { status: 400 }
      );
    }

    // 4. Branch & Geofence Verification
    const branch = await prisma.branch.findUnique({
      where: { id: session.employee.branchId },
      include: { workLocations: true },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy cơ sở làm việc của nhân viên." },
        { status: 400 }
      );
    }

    let geofenceStatus: GeofenceStatus = GeofenceStatus.INSIDE;
    let distanceToBranch = 0;
    const effectiveRadius = branch.radiusMeters + Math.max(accuracyMeters || 20, 50);

    // Calculate real GPS distance if coordinates are provided
    if (latitude !== undefined && longitude !== undefined) {
      distanceToBranch = calculateHaversineDistance(
        { latitude, longitude },
        { latitude: branch.latitude, longitude: branch.longitude }
      );

      if (distanceToBranch <= effectiveRadius) {
        geofenceStatus = GeofenceStatus.INSIDE;
      } else {
        geofenceStatus = GeofenceStatus.OUTSIDE;
        
        // If strict mode is enforced and distance is exceeded, reject
        if (strictMode) {
          return NextResponse.json(
            {
              success: false,
              error: `Bạn đang cách cơ sở làm việc ${Math.round(distanceToBranch)}m, vượt quá bán kính quy định (${branch.radiusMeters}m). Hãy bấm "Đồng bộ vị trí làm văn phòng" hoặc di chuyển vào gần cơ sở.`,
            },
            { status: 400 }
          );
        }

        // Otherwise: Record off-location risk flag but allow check-in to proceed with actual GPS saved
        await prisma.attendanceRiskFlag.create({
          data: {
            orgId: session.orgId,
            employeeId: currentEmployeeId,
            riskType: RiskType.OFF_LOCATION,
            severity: distanceToBranch > 5000 ? RiskSeverity.MEDIUM : RiskSeverity.LOW,
            riskScore: distanceToBranch > 5000 ? 50 : 25,
            description: `Chấm công GPS thực tế ngoài bán kính cơ sở (${Math.round(distanceToBranch)}m so với bán kính ${branch.radiusMeters}m).`,
            evidence: JSON.stringify({
              realLat: latitude,
              realLng: longitude,
              accuracyMeters: accuracyMeters || 15,
              branchLat: branch.latitude,
              branchLng: branch.longitude,
              distanceMeters: Math.round(distanceToBranch),
            }),
          },
        });
      }
    }

    // 5. Verification Method resolution
    let method: VerificationMethod = VerificationMethod.GPS_ONLY;

    if (qrToken && stationCode) {
      const qrStation = await prisma.qRStation.findFirst({
        where: { stationCode, orgId: session.orgId, isActive: true },
      });

      if (qrStation) {
        const qrValidation = validateDynamicQRToken(
          stationCode,
          qrStation.secretSeed,
          qrToken,
          qrStation.refreshIntervalSeconds
        );
        if (qrValidation.isValid) {
          method = VerificationMethod.GPS_QR;
        }
      }
    }

    if (webAuthnAssertion) method = VerificationMethod.WEBAUTHN;
    if (shift.requireFace && faceVerificationPayload) method = VerificationMethod.FACE_LIVENESS;

    // 6. Calculate On-Time / Late Status based on server time
    const [startHour, startMinute] = shift.startTime.split(":").map(Number);
    const shiftStartTime = new Date(serverNow);
    shiftStartTime.setHours(startHour, startMinute, 0, 0);

    const toleranceMinutes = shift.lateCheckInToleranceMinutes ?? 15;
    const allowedLatestTime = new Date(shiftStartTime.getTime() + toleranceMinutes * 60 * 1000);

    let isLate = false;
    let lateMinutes = 0;

    if (serverNow.getTime() > allowedLatestTime.getTime()) {
      isLate = true;
      lateMinutes = Math.floor((serverNow.getTime() - shiftStartTime.getTime()) / (60 * 1000));
    }

    const noteText = isLate
      ? `Đi muộn ${lateMinutes}p (GPS: ${geofenceStatus === "INSIDE" ? "Tại VP" : Math.round(distanceToBranch) + "m ngoài VP"})`
      : `Đúng giờ (GPS: ${geofenceStatus === "INSIDE" ? "Tại VP" : Math.round(distanceToBranch) + "m ngoài VP"})`;

    // 7. Execute Database Transaction (save real attendance data)
    const result = await prisma.$transaction(async (tx) => {
      // Upsert attendance session
      const sessionRecord = await tx.attendanceSession.upsert({
        where: {
          employeeId_date: {
            employeeId: currentEmployeeId,
            date: todayDate,
          },
        },
        create: {
          employeeId: currentEmployeeId,
          scheduleAssignmentId: assignment?.id,
          date: todayDate,
          status: AttendanceStatus.IN_PROGRESS,
          checkInTime: serverNow,
          standardHours: shift.standardWorkHours,
          isLate,
          lateMinutes,
          presenceStatus: "VERIFIED",
          notes: noteText,
        },
        update: {
          checkInTime: serverNow,
          status: AttendanceStatus.IN_PROGRESS,
          isLate,
          lateMinutes,
          notes: noteText,
        },
      });

      // Create attendance event
      const eventRecord = await tx.attendanceEvent.create({
        data: {
          sessionId: sessionRecord.id,
          employeeId: currentEmployeeId,
          eventType: EventType.CHECK_IN,
          eventTime: serverNow,
          clientTime: body.clientTime ? new Date(body.clientTime) : serverNow,
          latitude: latitude !== undefined ? Number(latitude) : null,
          longitude: longitude !== undefined ? Number(longitude) : null,
          accuracyMeters: accuracyMeters !== undefined ? Number(accuracyMeters) : null,
          geofenceStatus,
          verificationMethod: method,
          deviceId: deviceId || null,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Unknown",
          status: EventStatus.VALID,
          notes: noteText,
        },
      });

      // Create evidence record
      await tx.attendanceEvidence.create({
        data: {
          eventId: eventRecord.id,
          evidenceType: method,
          rawPayload: JSON.stringify({
            realLatitude: latitude,
            realLongitude: longitude,
            accuracyMeters: accuracyMeters || 15,
            distanceToBranchMeters: Math.round(distanceToBranch),
            geofenceStatus,
            isLate,
            lateMinutes,
            serverTimestamp: serverNow.toISOString(),
          }),
          isVerified: true,
          verificationScore: geofenceStatus === "INSIDE" ? 1.0 : 0.85,
        },
      });

      return { sessionRecord, eventRecord };
    });

    return NextResponse.json({
      success: true,
      message: isLate
        ? `Ghi nhận Check-in thành công (Đi muộn ${lateMinutes} phút so với giờ ca ${shift.startTime})`
        : "Ghi nhận Check-in thành công đúng giờ!",
      details: {
        employeeName: session.employee.fullName,
        employeeCode: session.employee.employeeCode,
        department: session.employee.department?.name,
        shiftName: shift.name,
        checkInTime: serverNow.toISOString(),
        locationName: branch.name,
        realCoords: latitude !== undefined ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : "Mặc định cơ sở",
        accuracyMeters: accuracyMeters ? `±${Math.round(accuracyMeters)}m` : "±15m",
        distanceMeters: Math.round(distanceToBranch),
        geofenceStatus,
        isLate,
        lateMinutes,
        verificationMethod: method,
        sessionId: result.sessionRecord.id,
      },
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý chấm công vào: " + error.message },
      { status: 500 }
    );
  }
}
