import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    const currentSession = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: session.employee.id,
        date: startOfToday,
      },
      include: {
        events: {
          orderBy: { eventTime: "desc" },
          include: { evidence: true },
        },
        presenceChallenges: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasCheckedIn: !!currentSession?.checkInTime,
      hasCheckedOut: !!currentSession?.checkOutTime,
      session: currentSession,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi lấy trạng thái chấm công: " + error.message },
      { status: 500 }
    );
  }
}
