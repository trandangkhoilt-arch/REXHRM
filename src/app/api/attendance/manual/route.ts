import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventType, VerificationMethod, GeofenceStatus, EventStatus, AttendanceStatus, RoleType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    const isPrivileged = [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER].includes(session.role as any);
    if (!isPrivileged) {
      return unauthorizedResponse("Chỉ Quản trị viên và Nhân sự mới có quyền thêm/điều chỉnh chấm công trực tiếp.");
    }

    const body = await req.json();
    const {
      employeeId,
      date,
      checkInTime, // e.g. "08:30" or ISO string
      checkOutTime, // e.g. "17:30" or ISO string
      notes = "Nhân sự thêm công trực tiếp",
      status = AttendanceStatus.COMPLETED,
    } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn nhân viên và ngày chấm công." },
        { status: 400 }
      );
    }

    // Verify target employee exists
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, branch: true },
    });

    if (!targetEmployee) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy nhân viên được chỉ định." },
        { status: 404 }
      );
    }

    // Parse date (UTC midnight)
    const [year, month, day] = date.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    // Construct full DateTime for check-in and check-out
    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    if (checkInTime) {
      if (checkInTime.includes("T")) {
        checkInDate = new Date(checkInTime);
      } else {
        const [inH, inM] = checkInTime.split(":").map(Number);
        checkInDate = new Date(year, month - 1, day, inH, inM, 0);
      }
    }

    if (checkOutTime) {
      if (checkOutTime.includes("T")) {
        checkOutDate = new Date(checkOutTime);
      } else {
        const [outH, outM] = checkOutTime.split(":").map(Number);
        checkOutDate = new Date(year, month - 1, day, outH, outM, 0);
      }
    }

    // Find shift
    const defaultShift = await prisma.shift.findFirst({
      where: { orgId: session.orgId, type: "ADMINISTRATIVE" },
    });

    let isLate = false;
    let lateMinutes = 0;
    if (checkInDate && defaultShift) {
      const [shH, shM] = defaultShift.startTime.split(":").map(Number);
      const shiftStart = new Date(year, month - 1, day, shH, shM, 0);
      const tolerance = defaultShift.lateCheckInToleranceMinutes ?? 15;
      if (checkInDate.getTime() > shiftStart.getTime() + tolerance * 60 * 1000) {
        isLate = true;
        lateMinutes = Math.floor((checkInDate.getTime() - shiftStart.getTime()) / (60 * 1000));
      }
    }

    let isEarlyLeave = false;
    let earlyLeaveMinutes = 0;
    let workHours = 8.0;
    let durationMinutes = 480;

    if (checkInDate && checkOutDate) {
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      durationMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      let breakMinutes = durationMinutes > 300 ? 60 : 0;
      const netMinutes = Math.max(1, durationMinutes - breakMinutes);
      workHours = Math.round((netMinutes / 60) * 10) / 10;

      if (defaultShift) {
        const [endH, endM] = defaultShift.endTime.split(":").map(Number);
        const shiftEnd = new Date(year, month - 1, day, endH, endM, 0);
        const earlyTolerance = defaultShift.earlyCheckOutToleranceMinutes ?? 15;
        if (checkOutDate.getTime() < shiftEnd.getTime() - earlyTolerance * 60 * 1000) {
          isEarlyLeave = true;
          earlyLeaveMinutes = Math.floor((shiftEnd.getTime() - checkOutDate.getTime()) / (60 * 1000));
        }
      }
    }

    const overtimeHours = workHours > 8.0 ? Math.round((workHours - 8.0) * 10) / 10 : 0;
    const currentEmployeeId = session.employee.id;
    const currentEmployeeName = session.employee.fullName;

    const result = await prisma.$transaction(async (tx) => {
      const sessionRecord = await tx.attendanceSession.upsert({
        where: {
          employeeId_date: {
            employeeId: targetEmployee.id,
            date: targetDate,
          },
        },
        create: {
          employeeId: targetEmployee.id,
          date: targetDate,
          status: checkOutDate ? AttendanceStatus.COMPLETED : AttendanceStatus.IN_PROGRESS,
          checkInTime: checkInDate,
          checkOutTime: checkOutDate,
          standardHours: defaultShift?.standardWorkHours ?? 8.0,
          durationMinutes,
          workHours,
          overtimeHours,
          isLate,
          lateMinutes,
          isEarlyLeave,
          earlyLeaveMinutes,
          presenceStatus: "VERIFIED",
          notes: `${notes} (Thêm bởi ${currentEmployeeName})`,
        },
        update: {
          status: checkOutDate ? AttendanceStatus.COMPLETED : AttendanceStatus.IN_PROGRESS,
          checkInTime: checkInDate || undefined,
          checkOutTime: checkOutDate || undefined,
          durationMinutes,
          workHours,
          overtimeHours,
          isLate,
          lateMinutes,
          isEarlyLeave,
          earlyLeaveMinutes,
          presenceStatus: "VERIFIED",
          notes: `${notes} (Cập nhật bởi ${currentEmployeeName})`,
        },
      });

      if (checkInDate) {
        await tx.attendanceEvent.create({
          data: {
            sessionId: sessionRecord.id,
            employeeId: targetEmployee.id,
            eventType: EventType.CHECK_IN,
            eventTime: checkInDate,
            verificationMethod: VerificationMethod.MANUAL,
            geofenceStatus: GeofenceStatus.INSIDE,
            status: EventStatus.VALID,
            notes: `Thêm trực tiếp bởi ${currentEmployeeName}`,
          },
        });
      }

      if (checkOutDate) {
        await tx.attendanceEvent.create({
          data: {
            sessionId: sessionRecord.id,
            employeeId: targetEmployee.id,
            eventType: EventType.CHECK_OUT,
            eventTime: checkOutDate,
            verificationMethod: VerificationMethod.MANUAL,
            geofenceStatus: GeofenceStatus.INSIDE,
            status: EventStatus.VALID,
            notes: `Thêm trực tiếp bởi ${currentEmployeeName}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          employeeId: currentEmployeeId,
          action: "MANUAL_ATTENDANCE_RECORD",
          entity: "AttendanceSession",
          entityId: sessionRecord.id,
          details: JSON.stringify({
            targetEmployeeId: targetEmployee.id,
            targetEmployeeName: targetEmployee.fullName,
            date,
            checkInDate,
            checkOutDate,
            workHours,
            notes,
          }),
        },
      });

      return sessionRecord;
    });

    return NextResponse.json({
      success: true,
      message: `Đã lưu thông tin chấm công thực tế cho nhân viên "${targetEmployee.fullName}" (${targetEmployee.employeeCode}) ngày ${date} thành công!`,
      session: result,
    });
  } catch (error: any) {
    console.error("Manual attendance error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi ghi nhận chấm công thủ công: " + error.message },
      { status: 500 }
    );
  }
}
