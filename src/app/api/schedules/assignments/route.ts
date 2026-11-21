import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, ScheduleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const employeeId = searchParams.get("employeeId");

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (session.role === RoleType.EMPLOYEE && session.employee) {
      where.employeeId = session.employee.id;
    }

    if (departmentId) {
      where.employee = { departmentId };
    }

    if (startDateParam && endDateParam) {
      where.workDate = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      };
    }

    const assignments = await prisma.scheduleAssignment.findMany({
      where,
      include: {
        shift: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            avatarUrl: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { workDate: "asc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải lịch làm việc: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER])) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { employeeIds, departmentId, shiftId, startDates, notes } = body;

    if (!shiftId || !startDates || !Array.isArray(startDates) || startDates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn ca làm việc và ít nhất một ngày làm việc." },
        { status: 400 }
      );
    }

    let targetEmployeeIds: string[] = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (departmentId) {
      const emps = await prisma.employee.findMany({
        where: { departmentId, employmentStatus: "ACTIVE" },
        select: { id: true },
      });
      targetEmployeeIds = emps.map((e) => e.id);
    }

    if (targetEmployeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy nhân viên nào để phân ca." },
        { status: 400 }
      );
    }

    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const empId of targetEmployeeIds) {
        for (const dateStr of startDates) {
          const workDate = new Date(dateStr);
          const normalizedDate = new Date(Date.UTC(workDate.getFullYear(), workDate.getMonth(), workDate.getDate()));

          await tx.scheduleAssignment.upsert({
            where: {
              employeeId_workDate: {
                employeeId: empId,
                workDate: normalizedDate,
              },
            },
            create: {
              employeeId: empId,
              shiftId,
              workDate: normalizedDate,
              status: ScheduleStatus.SCHEDULED,
              notes,
            },
            update: {
              shiftId,
              status: ScheduleStatus.SCHEDULED,
              notes,
            },
          });
          createdCount++;
        }
      }

      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          action: "BATCH_SCHEDULE_ASSIGNMENT",
          entity: "ScheduleAssignment",
          details: JSON.stringify({ shiftId, targetEmployees: targetEmployeeIds.length, daysCount: startDates.length }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Phân ca thành công! Đã tạo/cập nhật ${createdCount} lượt lịch làm việc cho ${targetEmployeeIds.length} nhân sự.`,
    });
  } catch (error: any) {
    console.error("Assign schedules error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi phân ca làm việc: " + error.message },
      { status: 500 }
    );
  }
}
