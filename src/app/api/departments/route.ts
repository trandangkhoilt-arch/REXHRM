import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const departments = await prisma.department.findMany({
      where: { orgId: session.orgId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, fullName: true, employeeCode: true, avatarUrl: true } },
        _count: { select: { employees: true, positions: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải danh sách phòng ban: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse();
    }

    const { name, code, branchId, managerId, parentId } = await req.json();

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Tên phòng ban và mã phòng ban là bắt buộc." },
        { status: 400 }
      );
    }

    const dept = await prisma.department.create({
      data: {
        orgId: session.orgId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        branchId: branchId || null,
        managerId: managerId || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tạo phòng ban "${dept.name}" thành công!`,
      department: dept,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tạo phòng ban: " + error.message },
      { status: 500 }
    );
  }
}
