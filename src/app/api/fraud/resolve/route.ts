import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, RiskStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER])) {
      return unauthorizedResponse("Bạn không có quyền xử lý cảnh báo gian lận.");
    }

    const { flagId, status = RiskStatus.RESOLVED, resolutionNotes } = await req.json();

    if (!flagId || !resolutionNotes) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập ghi chú và kết luận xử lý cảnh báo." },
        { status: 400 }
      );
    }

    const flag = await prisma.attendanceRiskFlag.findUnique({
      where: { id: flagId },
      include: { employee: true },
    });

    if (!flag || flag.orgId !== session.orgId) {
      return NextResponse.json({ success: false, error: "Không tìm thấy cảnh báo." }, { status: 404 });
    }

    const updated = await prisma.attendanceRiskFlag.update({
      where: { id: flagId },
      data: {
        status,
        resolvedBy: session.employee.fullName,
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        employeeId: flag.employeeId,
        action: "RESOLVE_FRAUD_FLAG",
        entity: "AttendanceRiskFlag",
        entityId: flag.id,
        details: JSON.stringify({
          riskType: flag.riskType,
          resolvedStatus: status,
          resolutionNotes,
          handler: session.employee.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái cảnh báo thành: ${status}.`,
      flag: updated,
    });
  } catch (error: any) {
    console.error("Resolve risk flag error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý cảnh báo: " + error.message },
      { status: 500 }
    );
  }
}
