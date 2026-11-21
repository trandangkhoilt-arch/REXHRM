import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    const { employeeId, challengeType = "RANDOM", expireMinutes = 15 } = await req.json();

    const targetEmployeeId = employeeId || session.employee.id;

    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    // Find active session for today
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: targetEmployeeId,
        date: startOfToday,
        status: "IN_PROGRESS",
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { success: false, error: "Nhân viên chưa có phiên chấm công đang hoạt động hôm nay để gửi thử thách hiện diện." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    const challenge = await prisma.presenceChallenge.create({
      data: {
        sessionId: attendanceSession.id,
        employeeId: targetEmployeeId,
        challengeType: challengeType as any,
        challengeToken: token,
        expiresAt,
        status: "PENDING",
      },
    });

    // Notify employee
    const userToNotify = await prisma.user.findFirst({
      where: { employee: { id: targetEmployeeId } },
    });

    if (userToNotify) {
      await prisma.notification.create({
        data: {
          userId: userToNotify.id,
          title: "Yêu cầu xác minh hiện diện tại nơi làm việc",
          message: `Hệ thống vừa phát tín hiệu kiểm tra hiện diện ngẫu nhiên. Vui lòng xác thực trước ${expiresAt.toLocaleTimeString("vi-VN")}.`,
          type: "PRESENCE_PROBE",
          linkUrl: "/attendance",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã tạo thử thách kiểm tra hiện diện thành công.",
      challenge,
    });
  } catch (error: any) {
    console.error("Create presence challenge error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tạo yêu cầu xác minh hiện diện: " + error.message },
      { status: 500 }
    );
  }
}
