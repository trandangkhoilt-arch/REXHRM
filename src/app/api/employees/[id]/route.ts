import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        position: true,
        branch: true,
        manager: { select: { id: true, fullName: true, employeeCode: true } },
        directReports: { select: { id: true, fullName: true, employeeCode: true, position: true } },
        contracts: { orderBy: { startDate: "desc" } },
        leaveBalances: { include: { leaveType: true } },
        user: { select: { id: true, email: true, role: true, status: true, lastLoginAt: true } },
        attendanceSessions: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!employee || employee.orgId !== session.orgId) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ nhân viên." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi lấy chi tiết nhân viên: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      gender,
      dateOfBirth,
      departmentId,
      positionId,
      branchId,
      managerId,
      workMode,
      contractType,
      employmentStatus,
      baseSalary,
      userRole,
    } = body;

    const existingEmp = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!existingEmp || existingEmp.orgId !== session.orgId) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ nhân viên để cập nhật." },
        { status: 404 }
      );
    }

    const fullName = `${(lastName || existingEmp.lastName).trim()} ${(firstName || existingEmp.firstName).trim()}`;

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id: params.id },
        data: {
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
          fullName,
          phone: phone?.trim(),
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          departmentId,
          positionId,
          branchId,
          managerId: managerId === "" ? null : managerId,
          workMode,
          contractType,
          employmentStatus,
          baseSalary: baseSalary ? Number(baseSalary) : undefined,
        },
      });

      if (userRole && existingEmp.user) {
        await tx.user.update({
          where: { id: existingEmp.user.id },
          data: { role: userRole },
        });
      }

      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          employeeId: params.id,
          action: "UPDATE_EMPLOYEE",
          entity: "Employee",
          entityId: params.id,
          details: JSON.stringify(body),
        },
      });

      return emp;
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật hồ sơ nhân viên thành công!",
      employee: updated,
    });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi cập nhật hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse();
    }

    const { status, action } = await req.json();

    const emp = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!emp || emp.orgId !== session.orgId) {
      return NextResponse.json({ success: false, error: "Không tìm thấy nhân viên." }, { status: 404 });
    }

    if (action === "TOGGLE_USER_LOCK" && emp.user) {
      const newStatus = emp.user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await prisma.user.update({
        where: { id: emp.user.id },
        data: { status: newStatus },
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${newStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản đăng nhập của nhân viên.`,
        userStatus: newStatus,
      });
    }

    if (status) {
      await prisma.employee.update({
        where: { id: params.id },
        data: { employmentStatus: status },
      });

      return NextResponse.json({
        success: true,
        message: `Đã chuyển trạng thái làm việc sang: ${status}`,
      });
    }

    return NextResponse.json({ success: false, error: "Không có hành động hợp lệ." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi thay đổi trạng thái: " + error.message },
      { status: 500 }
    );
  }
}
