import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get("periodId");
    const employeeIdParam = searchParams.get("employeeId");

    const isFinanceOrSuperAdmin = [RoleType.SUPER_ADMIN, RoleType.PAYROLL, RoleType.AUDITOR].includes(session.role as any);

    // If regular employee or manager without payroll role, they CANNOT see other staff salaries!
    if (!isFinanceOrSuperAdmin && employeeIdParam && employeeIdParam !== session.employee.id) {
      return unauthorizedResponse("Chính sách bảo mật: Bạn chỉ có quyền xem phiếu lương cá nhân của chính mình.");
    }

    const where: any = {};

    if (periodId) {
      where.payrollPeriodId = periodId;
    }

    if (!isFinanceOrSuperAdmin) {
      // Strictly restrict to current employee
      where.employeeId = session.employee.id;
      where.releasedToEmployee = true; // Only released slips visible to regular staff
    } else if (employeeIdParam) {
      where.employeeId = employeeIdParam;
    }

    const items = await prisma.payrollItem.findMany({
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
        payrollPeriod: {
          select: {
            id: true,
            periodName: true,
            month: true,
            year: true,
            status: true,
          },
        },
      },
      orderBy: { employee: { employeeCode: "asc" } },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Payroll items error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải phiếu lương: " + error.message },
      { status: 500 }
    );
  }
}
