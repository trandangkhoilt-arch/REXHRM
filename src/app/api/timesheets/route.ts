import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, TimesheetStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const departmentId = searchParams.get("departmentId");
    const employeeId = searchParams.get("employeeId");

    const isPrivileged = [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER, RoleType.PAYROLL, RoleType.AUDITOR].includes(session.role as any);

    const where: any = {
      orgId: session.orgId,
      month,
      year,
    };

    if (!isPrivileged) {
      where.employeeId = session.employee.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    } else if (departmentId) {
      where.employee = { departmentId };
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            avatarUrl: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, title: true } },
          },
        },
        adjustments: true,
      },
      orderBy: { employee: { employeeCode: "asc" } },
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      timesheets,
    });
  } catch (error: any) {
    console.error("Timesheet get error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải bảng công: " + error.message },
      { status: 500 }
    );
  }
}
