import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    // Find and delete existing session for today to allow fresh check-in
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: session.employee.id,
        date: todayDate,
      },
    });

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.attendanceEvidence.deleteMany({
          where: { event: { sessionId: existing.id } },
        });
        await tx.attendanceEvent.deleteMany({
          where: { sessionId: existing.id },
        });
        await tx.presenceChallenge.deleteMany({
          where: { sessionId: existing.id },
        });
        await tx.attendanceRiskFlag.deleteMany({
          where: { sessionId: existing.id },
        });
        await tx.attendanceSession.delete({
          where: { id: existing.id },
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã làm mới phiên chấm công hôm nay thành công. Bạn có thể thực hiện Check-in mới ngay bây giờ!",
    });
  } catch (error: any) {
    console.error("Reset today attendance error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi làm mới phiên: " + error.message },
      { status: 500 }
    );
  }
}
