import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestType, RequestStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "mine"; // "mine" | "to_approve" | "balances" | "holidays"

    if (tab === "balances") {
      const balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId: session.employee.id,
          year: new Date().getFullYear(),
        },
        include: { leaveType: true },
      });
      return NextResponse.json({ success: true, balances });
    }

    if (tab === "holidays") {
      const holidays = await prisma.holidayCalendar.findMany({
        where: { orgId: session.orgId },
        orderBy: { holidayDate: "asc" },
      });
      return NextResponse.json({ success: true, holidays });
    }

    if (tab === "to_approve") {
      // Pending requests for this manager or HR/Admin
      const isSuperOrHR = ["SUPER_ADMIN", "HR_ADMIN"].includes(session.role as any);

      let whereClause: any = { status: RequestStatus.PENDING };

      if (!isSuperOrHR) {
        // Only requests from direct reports
        whereClause.employee = { managerId: session.employee.id };
      }

      const requests = await prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              avatarUrl: true,
              department: { select: { name: true } },
              position: { select: { title: true } },
            },
          },
          leaveType: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, requests });
    }

    // Default: "mine"
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: session.employee.id },
      include: {
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Requests list error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải danh sách đơn từ: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    const body = await req.json();
    const {
      requestType = RequestType.ANNUAL_LEAVE,
      leaveTypeId,
      startDate,
      endDate,
      startHalf = "FULL",
      endHalf = "FULL",
      durationDays = 1.0,
      reason,
      attachmentUrl,
    } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn khoảng thời gian và nêu rõ lý do làm đơn." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { success: false, error: "Ngày bắt đầu không được lớn hơn ngày kết thúc." },
        { status: 400 }
      );
    }

    // Check balance for annual leave
    if (requestType === RequestType.ANNUAL_LEAVE && leaveTypeId) {
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: session.employee.id,
          leaveTypeId,
          year: start.getFullYear(),
        },
      });

      if (balance && balance.remainingDays < Number(durationDays)) {
        return NextResponse.json(
          {
            success: false,
            error: `Số dư phép năm của bạn còn ${balance.remainingDays} ngày, không đủ cho đơn xin ${durationDays} ngày.`,
          },
          { status: 400 }
        );
      }
    }

    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: session.employee.id,
        leaveTypeId: leaveTypeId || null,
        requestType,
        startDate: start,
        endDate: end,
        startHalf,
        endHalf,
        durationDays: Number(durationDays),
        reason: reason.trim(),
        attachmentUrl: attachmentUrl || null,
        status: RequestStatus.PENDING,
      },
    });

    // Notify direct manager if assigned
    if (session.employee.managerId) {
      const managerUser = await prisma.user.findFirst({
        where: { employee: { id: session.employee.managerId } },
      });
      if (managerUser) {
        await prisma.notification.create({
          data: {
            userId: managerUser.id,
            title: "Có đơn từ mới cần phê duyệt",
            message: `Nhân viên ${session.employee.fullName} vừa gửi đơn "${requestType}" (${durationDays} ngày).`,
            type: "REQUEST_PENDING",
            linkUrl: "/requests",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gửi đơn thành công! Đơn đang chờ quản lý trực tiếp phê duyệt.",
      request: newRequest,
    });
  } catch (error: any) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi gửi đơn từ: " + error.message },
      { status: 500 }
    );
  }
}
