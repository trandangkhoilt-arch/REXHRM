import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const [organization, branches, qrStations, auditLogs] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: session.orgId },
      }),
      prisma.branch.findMany({
        where: { orgId: session.orgId },
        include: { workLocations: true },
      }),
      prisma.qRStation.findMany({
        where: { orgId: session.orgId },
        include: { branch: { select: { name: true } } },
      }),
      prisma.auditLog.findMany({
        where: { orgId: session.orgId },
        include: {
          user: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      organization,
      branches,
      qrStations,
      auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải cấu hình hệ thống: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN])) {
      return unauthorizedResponse("Chỉ Super Admin mới có quyền thay đổi thông tin cài đặt tổ chức.");
    }

    const { name, taxCode, address, phone, email, timezone } = await req.json();

    const updated = await prisma.organization.update({
      where: { id: session.orgId },
      data: {
        name: name?.trim(),
        taxCode: taxCode?.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        email: email?.trim(),
        timezone: timezone || "Asia/Ho_Chi_Minh",
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        action: "UPDATE_ORGANIZATION_SETTINGS",
        entity: "Organization",
        entityId: session.orgId,
        details: JSON.stringify({ name, taxCode, address, phone }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật cài đặt tổ chức thành công!",
      organization: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi cập nhật cài đặt: " + error.message },
      { status: 500 }
    );
  }
}
