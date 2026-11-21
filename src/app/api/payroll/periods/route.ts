import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, PayrollStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const periods = await prisma.payrollPeriod.findMany({
      where: { orgId: session.orgId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ success: true, periods });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải kỳ bảng lương: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.PAYROLL, RoleType.HR_ADMIN])) {
      return unauthorizedResponse("Chỉ Nhân sự tính lương và Quản trị viên mới có quyền tạo kỳ lương mới.");
    }

    const { month, year, periodName, standardWorkDays = 22 } = await req.json();

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn tháng và năm cho kỳ bảng lương." },
        { status: 400 }
      );
    }

    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 0));

    const name = periodName || `Bảng Lương Tháng ${month}/${year}`;

    const period = await prisma.payrollPeriod.upsert({
      where: {
        orgId_month_year: {
          orgId: session.orgId,
          month: Number(month),
          year: Number(year),
        },
      },
      create: {
        orgId: session.orgId,
        month: Number(month),
        year: Number(year),
        periodName: name,
        startDate,
        endDate,
        standardWorkDays: Number(standardWorkDays),
        status: PayrollStatus.DRAFT,
      },
      update: {
        periodName: name,
        standardWorkDays: Number(standardWorkDays),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã khởi tạo ${period.periodName} thành công!`,
      period,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi khởi tạo kỳ bảng lương: " + error.message },
      { status: 500 }
    );
  }
}
