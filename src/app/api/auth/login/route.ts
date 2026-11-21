import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ email và mật khẩu." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
            branch: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Tài khoản của bạn đang bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ HR." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session JWT token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      employeeId: user.employee?.id,
      employeeCode: user.employee?.employeeCode,
      fullName: user.employee?.fullName,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        employeeId: user.employee?.id,
        action: "USER_LOGIN",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Unknown",
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đăng nhập: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
