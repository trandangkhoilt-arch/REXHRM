import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return unauthenticatedResponse();
    }

    // Fetch unread notifications count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.userId,
        isRead: false,
      },
    });

    // Fetch today's schedule assignment
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    let assignment = null;
    let todaySession = null;

    if (session.employeeId) {
      assignment = await prisma.scheduleAssignment.findFirst({
        where: {
          employeeId: session.employeeId,
          workDate: startOfToday,
        },
        include: {
          shift: true,
        },
      });

      todaySession = await prisma.attendanceSession.findFirst({
        where: {
          employeeId: session.employeeId,
          date: startOfToday,
        },
        include: {
          events: {
            orderBy: { eventTime: "desc" },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        employee: session.employee,
      },
      todaySchedule: assignment,
      todayAttendance: todaySession,
      unreadNotificationsCount: unreadCount,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi lấy thông tin phiên làm việc: " + error.message },
      { status: 500 }
    );
  }
}
