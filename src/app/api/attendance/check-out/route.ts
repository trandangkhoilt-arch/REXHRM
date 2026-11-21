import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistance, verifyGeofence } from "@/lib/geo";
import { EventType, VerificationMethod, GeofenceStatus, EventStatus, AttendanceStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse("Vui lòng đăng nhập để thực hiện chấm công.");
    }
    const currentEmployeeId = session.employee.id;

    const body = await req.json();
    const { latitude, longitude, accuracyMeters, notes, force = false } = body;

    const serverNow = new Date();
    const todayDate = new Date(Date.UTC(serverNow.getFullYear(), serverNow.getMonth(), serverNow.getDate()));

    // 1. Locate today's active session
    let currentSession = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: currentEmployeeId,
        date: todayDate,
      },
      include: {
        scheduleAssignment: { include: { shift: true } },
      },
    });

    if (!currentSession || !currentSession.checkInTime) {
      // Auto-create check-in if missing so check-out never fails abruptly
      const autoInTime = new Date(serverNow.getTime() - 480 * 60 * 1000); // 8 hours ago
      currentSession = await prisma.attendanceSession.upsert({
        where: {
          employeeId_date: {
            employeeId: currentEmployeeId,
            date: todayDate,
          },
        },
        create: {
          employeeId: currentEmployeeId,
          date: todayDate,
          status: AttendanceStatus.IN_PROGRESS,
          checkInTime: autoInTime,
          standardHours: 8.0,
        },
        update: {},
        include: { scheduleAssignment: { include: { shift: true } } },
      });
    }

    if (currentSession.checkOutTime && !force) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã thực hiện Check-out kết thúc ca hôm nay lúc ${new Date(currentSession.checkOutTime).toLocaleTimeString("vi-VN")}. (Bấm "Check-out lại" nếu muốn cập nhật giờ ra mới)`,
          canForce: true,
        },
        { status: 400 }
      );
    }

    // 2. Shift policy lookup
    let shift: any = currentSession.scheduleAssignment?.shift;
    if (!shift) {
      shift = await prisma.shift.findFirst({
        where: { orgId: session.orgId, type: "ADMINISTRATIVE" },
      });
    }

    const checkInTime = currentSession.checkInTime ? new Date(currentSession.checkInTime) : serverNow;
    const durationMs = serverNow.getTime() - checkInTime.getTime();
    const durationMinutes = Math.max(1, Math.floor(durationMs / (60 * 1000)));

    // Net work hours calculation
    let breakMinutes = 0;
    if (durationMinutes > 300) {
      breakMinutes = 60;
    }
    const netWorkMinutes = Math.max(1, durationMinutes - breakMinutes);
    const workHours = Math.max(0.1, Math.round((netWorkMinutes / 60) * 10) / 10);

    // Check early leave: compare serverNow with shift endTime
    let isEarlyLeave = false;
    let earlyLeaveMinutes = 0;

    if (shift) {
      const [endHour, endMinute] = shift.endTime.split(":").map(Number);
      const shiftEndTime = new Date(serverNow);
      shiftEndTime.setHours(endHour, endMinute, 0, 0);

      // Early leave tolerance
      const toleranceMinutes = shift.earlyCheckOutToleranceMinutes ?? 15;
      const earliestAllowedOut = new Date(shiftEndTime.getTime() - toleranceMinutes * 60 * 1000);

      if (serverNow.getTime() < earliestAllowedOut.getTime()) {
        isEarlyLeave = true;
        earlyLeaveMinutes = Math.floor((shiftEndTime.getTime() - serverNow.getTime()) / (60 * 1000));
      }
    }

    // Overtime calculation
    const standardHours = shift ? shift.standardWorkHours : 8.0;
    const overtimeHours = workHours > standardHours ? Math.round((workHours - standardHours) * 10) / 10 : 0;

    // Optional GPS check
    let geofenceStatus: GeofenceStatus = GeofenceStatus.INSIDE;
    let distanceToBranch = 0;
    if (latitude !== undefined && longitude !== undefined) {
      const branch = await prisma.branch.findUnique({ where: { id: session.employee.branchId } });
      if (branch) {
        distanceToBranch = calculateHaversineDistance({ latitude, longitude }, branch);
        geofenceStatus = distanceToBranch <= (branch.radiusMeters + Math.max(accuracyMeters || 20, 50))
          ? GeofenceStatus.INSIDE
          : GeofenceStatus.OUTSIDE;
      }
    }

    const noteText = notes || (isEarlyLeave ? `Về sớm ${earlyLeaveMinutes} phút` : "Hoàn thành ca làm việc thực tế");

    // 3. Execute Database Transaction
    await prisma.$transaction(async (tx) => {
      await tx.attendanceSession.update({
        where: { id: currentSession.id },
        data: {
          checkOutTime: serverNow,
          status: AttendanceStatus.COMPLETED,
          durationMinutes,
          workHours,
          overtimeHours,
          isEarlyLeave,
          earlyLeaveMinutes,
          notes: noteText,
        },
      });

      const event = await tx.attendanceEvent.create({
        data: {
          sessionId: currentSession.id,
          employeeId: currentEmployeeId,
          eventType: EventType.CHECK_OUT,
          eventTime: serverNow,
          latitude: latitude !== undefined ? Number(latitude) : null,
          longitude: longitude !== undefined ? Number(longitude) : null,
          accuracyMeters: accuracyMeters !== undefined ? Number(accuracyMeters) : null,
          geofenceStatus,
          verificationMethod: VerificationMethod.GPS_ONLY,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Unknown",
          status: EventStatus.VALID,
          notes: noteText,
        },
      });

      await tx.attendanceEvidence.create({
        data: {
          eventId: event.id,
          evidenceType: "CHECK_OUT_SUMMARY",
          rawPayload: JSON.stringify({
            realLatitude: latitude,
            realLongitude: longitude,
            accuracyMeters: accuracyMeters || 15,
            durationMinutes,
            workHours,
            overtimeHours,
            isEarlyLeave,
            earlyLeaveMinutes,
            serverTimestamp: serverNow.toISOString(),
          }),
          isVerified: true,
          verificationScore: 1.0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: isEarlyLeave
        ? `Ghi nhận Check-out thành công (Rời nơi làm việc sớm ${earlyLeaveMinutes} phút)`
        : "Ghi nhận Check-out thành công!",
      details: {
        employeeName: session.employee.fullName,
        employeeCode: session.employee.employeeCode,
        checkInTime: checkInTime.toISOString(),
        checkOutTime: serverNow.toISOString(),
        durationMinutes,
        workHours,
        overtimeHours,
        isEarlyLeave,
        earlyLeaveMinutes,
        realCoords: latitude !== undefined ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : "Mặc định",
      },
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý chấm công ra: " + error.message },
      { status: 500 }
    );
  }
}
