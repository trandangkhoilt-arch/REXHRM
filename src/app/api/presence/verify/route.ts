import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyGeofence } from "@/lib/geo";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }
    const currentEmployeeId = session.employee.id;

    const { challengeId, challengeToken, latitude, longitude, accuracyMeters } = await req.json();

    const challenge = await prisma.presenceChallenge.findFirst({
      where: {
        id: challengeId,
        challengeToken,
        employeeId: session.employee.id,
      },
      include: {
        session: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Thử thách xác minh không tồn tại hoặc mã token không khớp." },
        { status: 404 }
      );
    }

    if (challenge.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Thử thách này đã ở trạng thái: ${challenge.status}.` },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > new Date(challenge.expiresAt)) {
      // Mark as missed
      await prisma.presenceChallenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { success: false, error: "Thử thách xác minh hiện diện đã hết thời gian phản hồi." },
        { status: 400 }
      );
    }

    // Verify location if provided
    let isInside = true;
    if (latitude !== undefined && longitude !== undefined) {
      const branch = await prisma.branch.findUnique({ where: { id: session.employee.branchId } });
      if (branch) {
        const geoResult = verifyGeofence({ latitude, longitude }, accuracyMeters || 30, branch);
        isInside = geoResult.isInside;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.presenceChallenge.update({
        where: { id: challenge.id },
        data: {
          status: "RESPONDED",
          responseTime: now,
          notes: isInside ? "Đã xác minh hiện diện tại cơ sở" : "Xác minh ghi nhận ngoài bán kính",
        },
      });

      await tx.presenceVerification.create({
        data: {
          challengeId: challenge.id,
          employeeId: currentEmployeeId,
          responseTime: now,
          latitude: latitude || null,
          longitude: longitude || null,
          accuracyMeters: accuracyMeters || null,
          isVerified: isInside,
          notes: isInside ? "Thành công" : "Vị trí không đạt bán kính",
        },
      });

      // Update parent session presence status
      await tx.attendanceSession.update({
        where: { id: challenge.sessionId },
        data: {
          presenceStatus: isInside ? "VERIFIED" : "PARTIAL",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: isInside
        ? "Xác minh hiện diện thành công! Bạn đang hiện diện hợp lệ tại nơi làm việc."
        : "Đã ghi nhận phản hồi, tuy nhiên vị trí nằm ngoài bán kính quy định. Quản lý sẽ xem xét lại.",
    });
  } catch (error: any) {
    console.error("Presence verify error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi phản hồi xác minh hiện diện: " + error.message },
      { status: 500 }
    );
  }
}
