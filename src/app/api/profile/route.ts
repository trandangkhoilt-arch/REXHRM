import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const employee = await prisma.employee.findUnique({
      where: { id: session.employee.id },
      include: {
        department: true,
        position: true,
        branch: true,
        manager: { select: { id: true, fullName: true, employeeCode: true, email: true, phone: true } },
        contracts: { orderBy: { startDate: "desc" } },
        leaveBalances: { include: { leaveType: true } },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
            authenticators: { select: { id: true, friendlyName: true, createdAt: true, lastUsedAt: true } },
            devices: true,
          },
        },
      },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      profile: employee,
      recentActivity: recentAuditLogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải hồ sơ cá nhân: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const { phone, dateOfBirth, gender } = await req.json();

    const updated = await prisma.employee.update({
      where: { id: session.employee.id },
      data: {
        phone: phone ? String(phone).trim() : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        employeeId: session.employee.id,
        action: "UPDATE_MY_PROFILE",
        entity: "Employee",
        entityId: session.employee.id,
        details: JSON.stringify({ phone, gender }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin liên hệ cá nhân thành công!",
      profile: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi cập nhật hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}
