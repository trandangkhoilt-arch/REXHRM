import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, RiskStatus, RiskSeverity } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER, RoleType.AUDITOR])) {
      return unauthorizedResponse("Chỉ Quản lý, Nhân sự và Kiểm toán viên mới có quyền xem cảnh báo bất thường.");
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as RiskStatus | null;
    const severity = searchParams.get("severity") as RiskSeverity | null;
    const employeeId = searchParams.get("employeeId");

    const where: any = { orgId: session.orgId };

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (employeeId) where.employeeId = employeeId;

    const flags = await prisma.attendanceRiskFlag.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            avatarUrl: true,
            department: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
        session: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, flags });
  } catch (error: any) {
    console.error("Risk flags error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải danh sách cảnh báo gian lận: " + error.message },
      { status: 500 }
    );
  }
}
