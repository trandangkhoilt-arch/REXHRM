import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RoleType, EmploymentStatus, ContractType, Gender, WorkMode } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status") as EmploymentStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const where: any = { orgId: session.orgId };

    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (status) where.employmentStatus = status;

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          position: { select: { id: true, title: true, code: true } },
          branch: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, fullName: true, employeeCode: true } },
          user: { select: { id: true, role: true, status: true } },
        },
        orderBy: { employeeCode: "asc" },
        take: limit,
        skip,
      }),
    ]);

    return NextResponse.json({
      success: true,
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("List employees error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải danh sách nhân viên: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse("Chỉ Quản trị viên và Nhân sự mới có quyền tạo hồ sơ nhân viên mới.");
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      gender = Gender.MALE,
      dateOfBirth,
      departmentId,
      positionId,
      branchId,
      managerId,
      contractType = ContractType.OFFICIAL,
      workMode = WorkMode.OFFICE,
      baseSalary = 10000000,
      joinDate = new Date().toISOString(),
      role = RoleType.EMPLOYEE,
      password = "123456",
    } = body;

    if (!firstName || !lastName || !email || !departmentId || !positionId || !branchId) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email này đã được sử dụng bởi một tài khoản khác trong hệ thống." },
        { status: 400 }
      );
    }

    // Auto-generate employee code
    const totalCount = await prisma.employee.count({ where: { orgId: session.orgId } });
    const employeeCode = `NEX-${String(totalCount + 1).padStart(3, "0")}`;

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${lastName.trim()} ${firstName.trim()}`;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          orgId: session.orgId,
          email: email.toLowerCase().trim(),
          passwordHash,
          role,
          status: "ACTIVE",
        },
      });

      const newEmp = await tx.employee.create({
        data: {
          orgId: session.orgId,
          userId: newUser.id,
          branchId,
          departmentId,
          positionId,
          managerId: managerId || null,
          employeeCode,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone?.trim(),
          email: email.toLowerCase().trim(),
          avatarUrl: `https://i.pravatar.cc/150?u=${employeeCode}`,
          joinDate: new Date(joinDate),
          contractType,
          employmentStatus: EmploymentStatus.ACTIVE,
          workMode,
          baseSalary: Number(baseSalary),
        },
      });

      // Initialize leave balance
      const leaveTypes = await tx.leaveType.findMany({ where: { orgId: session.orgId } });
      const currentYear = new Date().getFullYear();

      for (const lt of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            employeeId: newEmp.id,
            leaveTypeId: lt.id,
            year: currentYear,
            totalDays: lt.defaultDaysPerYear,
            usedDays: 0,
            remainingDays: lt.defaultDaysPerYear,
          },
        });
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          employeeId: newEmp.id,
          action: "CREATE_EMPLOYEE",
          entity: "Employee",
          entityId: newEmp.id,
          details: JSON.stringify({ employeeCode, fullName, email }),
        },
      });

      return newEmp;
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo nhân viên ${result.fullName} (${result.employeeCode}) thành công!`,
      employee: result,
    });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tạo nhân viên mới: " + error.message },
      { status: 500 }
    );
  }
}
