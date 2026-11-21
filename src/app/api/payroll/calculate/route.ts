import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePayroll } from "@/lib/payroll";
import { RoleType, PayrollStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.PAYROLL])) {
      return unauthorizedResponse("Chỉ Nhân sự tính lương (C&B) hoặc Quản trị viên mới có quyền tính toán bảng lương.");
    }

    const { periodId } = await req.json();

    if (!periodId) {
      return NextResponse.json({ success: false, error: "Vui lòng chỉ định kỳ bảng lương." }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period || period.orgId !== session.orgId) {
      return NextResponse.json({ success: false, error: "Không tìm thấy kỳ bảng lương." }, { status: 404 });
    }

    if (period.status === PayrollStatus.LOCKED) {
      return NextResponse.json(
        { success: false, error: "Kỳ bảng lương này đã bị khóa (LOCKED). Không thể tính lại." },
        { status: 400 }
      );
    }

    // Fetch all active employees in the organization
    const employees = await prisma.employee.findMany({
      where: { orgId: session.orgId, employmentStatus: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] } },
    });

    // Fetch timesheets for this month & year
    const timesheets = await prisma.timesheet.findMany({
      where: {
        orgId: session.orgId,
        month: period.month,
        year: period.year,
      },
    });

    const timesheetMap = new Map<string, (typeof timesheets)[0]>();
    for (const ts of timesheets) {
      timesheetMap.set(ts.employeeId, ts);
    }

    let totalGross = 0;
    let totalNet = 0;
    const computedItems: any[] = [];

    for (const emp of employees) {
      const ts = timesheetMap.get(emp.id);
      const actualWorkDays = ts ? ts.actualDays : period.standardWorkDays;
      const overtimeHours = ts ? ts.overtimeHours : 0;
      const baseSalary = emp.baseSalary;

      // Fixed allowance based on position / standard policy
      const allowances = 1500000;
      const bonuses = 0;
      const deductions = 0;

      const calc = computePayroll({
        baseSalary,
        standardWorkDays: period.standardWorkDays,
        actualWorkDays,
        overtimeHours,
        allowances,
        bonuses,
        deductions,
      });

      totalGross += calc.grossSalary;
      totalNet += calc.netSalary;

      computedItems.push({
        payrollPeriodId: period.id,
        employeeId: emp.id,
        timesheetId: ts?.id || null,
        baseSalary: calc.baseSalary,
        actualWorkDays: calc.actualWorkDays,
        standardWorkDays: calc.standardWorkDays,
        actualWorkSalary: calc.actualWorkSalary,
        overtimePay: calc.overtimePay,
        allowances: calc.allowances,
        bonuses: calc.bonuses,
        deductions: calc.deductions,
        socialInsurance: calc.socialInsurance,
        healthInsurance: calc.healthInsurance,
        unemploymentInsurance: calc.unemploymentInsurance,
        personalIncomeTax: calc.personalIncomeTax,
        netSalary: calc.netSalary,
        status: PayrollStatus.DRAFT,
        releasedToEmployee: false,
      });
    }

    // Save with Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // Delete old items if re-calculating draft
      await tx.payrollItem.deleteMany({
        where: { payrollPeriodId: period.id },
      });

      // Insert newly computed items
      await tx.payrollItem.createMany({
        data: computedItems,
      });

      // Update period summary
      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          totalGrossSalary: totalGross,
          totalNetSalary: totalNet,
          status: PayrollStatus.REVIEWING,
        },
      });

      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          action: "CALCULATE_PAYROLL",
          entity: "PayrollPeriod",
          entityId: period.id,
          details: JSON.stringify({
            periodName: period.periodName,
            employeeCount: employees.length,
            totalGross,
            totalNet,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã tính toán thành công bảng lương cho ${computedItems.length} nhân sự. Tổng quỹ lương Net: ${totalNet.toLocaleString("vi-VN")} VND.`,
      summary: {
        totalEmployees: computedItems.length,
        totalGrossSalary: totalGross,
        totalNetSalary: totalNet,
      },
    });
  } catch (error: any) {
    console.error("Calculate payroll error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tính toán bảng lương: " + error.message },
      { status: 500 }
    );
  }
}
