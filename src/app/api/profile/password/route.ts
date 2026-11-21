import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có độ dài tối thiểu 6 ký tự." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return unauthenticatedResponse();

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        employeeId: session.employeeId,
        action: "CHANGE_PASSWORD",
        entity: "User",
        entityId: session.userId,
        details: JSON.stringify({ message: "Người dùng đổi mật khẩu thành công." }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi đổi mật khẩu: " + error.message },
      { status: 500 }
    );
  }
}
