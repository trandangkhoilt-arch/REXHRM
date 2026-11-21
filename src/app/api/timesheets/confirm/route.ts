import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, TimesheetStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse("Chỉ Quản trị viên và Nhân sự mới có quyền chốt kỳ bảng công.");
    }

    const { month, year, action = "CONFIRM" } = await req.json(); // action: "CONFIRM" | "LOCK" | "UNLOCK"

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Vui lòng chỉ định tháng và năm." }, { status: 400 });
    }

    let newStatus: TimesheetStatus = TimesheetStatus.CONFIRMED;
    if (action === "LOCK") newStatus = TimesheetStatus.LOCKED;
    if (action === "UNLOCK") newStatus = TimesheetStatus.DRAFT;

    const result = await prisma.timesheet.updateMany({
      where: {
        orgId: session.orgId,
        month: Number(month),
        year: Number(year),
      },
      data: {
        status: newStatus,
        confirmedBy: action !== "UNLOCK" ? session.employee.fullName : null,
        confirmedAt: action !== "UNLOCK" ? new Date() : null,
        lockedAt: action === "LOCK" ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        action: `${action}_TIMESHEET_PERIOD`,
        entity: "Timesheet",
        entityId: `${month}-${year}`,
        details: JSON.stringify({ month, year, updatedRecords: result.count, newStatus }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${action === "LOCK" ? "khóa hoàn toàn" : action === "CONFIRM" ? "xác nhận" : "mở lại"} kỳ bảng công tháng ${month}/${year} (${result.count} nhân sự).`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("Confirm timesheet error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi chốt kỳ bảng công: " + error.message },
      { status: 500 }
    );
  }
}
