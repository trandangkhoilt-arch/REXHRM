import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, PayrollStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN])) {
      return unauthorizedResponse("Chỉ Ban Giám Đốc (Super Admin) mới có quyền phê duyệt chốt chi trả bảng lương.");
    }

    const { periodId, action = "APPROVE" } = await req.json(); // action: "APPROVE" | "LOCK"

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { items: true },
    });

    if (!period || period.orgId !== session.orgId) {
      return NextResponse.json({ success: false, error: "Không tìm thấy kỳ bảng lương." }, { status: 404 });
    }

    const newStatus = action === "LOCK" ? PayrollStatus.LOCKED : PayrollStatus.APPROVED;

    await prisma.$transaction(async (tx) => {
      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          status: newStatus,
          approvedBy: session.employee?.fullName,
          lockedAt: action === "LOCK" ? new Date() : undefined,
        },
      });

      // Release payslips to employees
      await tx.payrollItem.updateMany({
        where: { payrollPeriodId: period.id },
        data: {
          status: newStatus,
          releasedToEmployee: true,
        },
      });

      // Send payslip ready notifications
      const employees = await tx.employee.findMany({
        where: { id: { in: period.items.map((i) => i.employeeId) } },
        include: { user: true },
      });

      for (const emp of employees) {
        if (emp.user) {
          await tx.notification.create({
            data: {
              userId: emp.user.id,
              title: `Phiếu lương ${period.periodName} đã phát hành`,
              message: `Bảng lương kỳ ${period.month}/${period.year} đã được phê duyệt. Bạn có thể xem chi tiết phiếu lương cá nhân.`,
              type: "PAYSLIP_READY",
              linkUrl: "/payroll",
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          action: `${action}_PAYROLL_PERIOD`,
          entity: "PayrollPeriod",
          entityId: period.id,
          details: JSON.stringify({
            periodName: period.periodName,
            totalGross: period.totalGrossSalary,
            totalNet: period.totalNetSalary,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${action === "LOCK" ? "khóa bảo mật" : "phê duyệt và phát hành"} ${period.periodName} cho toàn bộ nhân sự!`,
    });
  } catch (error: any) {
    console.error("Approve payroll error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi phê duyệt bảng lương: " + error.message },
      { status: 500 }
    );
  }
}
