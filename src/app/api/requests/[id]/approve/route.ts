import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, RequestStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER])) {
      return unauthorizedResponse("Bạn không có quyền duyệt đơn từ.");
    }

    const { action, comments } = await req.json(); // action: "APPROVE" | "REJECT"

    const request = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "Không tìm thấy đơn yêu cầu." }, { status: 404 });
    }

    if (request.status !== RequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: `Đơn này đã được xử lý ở trạng thái: ${request.status}.` },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? RequestStatus.APPROVED : RequestStatus.REJECTED;

    await prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: newStatus,
          reviewedBy: session.employee?.fullName,
          reviewNotes: comments || (action === "APPROVE" ? "Đã phê duyệt" : "Đã từ chối"),
        },
      });

      // 2. If approved and has leaveTypeId, deduct from LeaveBalance
      if (action === "APPROVE" && request.leaveTypeId) {
        const year = new Date(request.startDate).getFullYear();
        const balance = await tx.leaveBalance.findFirst({
          where: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        });

        if (balance) {
          const used = balance.usedDays + request.durationDays;
          const remaining = Math.max(0, balance.totalDays - used);
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: used,
              remainingDays: remaining,
            },
          });
        }
      }

      // 3. Notify the employee
      if (request.employee.user) {
        await tx.notification.create({
          data: {
            userId: request.employee.user.id,
            title: `Đơn của bạn đã được ${action === "APPROVE" ? "phê duyệt" : "từ chối"}`,
            message: `Người duyệt: ${session.employee?.fullName}. Ghi chú: ${comments || "Không có"}`,
            type: "REQUEST_RESOLVED",
            linkUrl: "/requests",
          },
        });
      }

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          orgId: session.orgId,
          userId: session.userId,
          employeeId: request.employeeId,
          action: `${action}_REQUEST`,
          entity: "LeaveRequest",
          entityId: request.id,
          details: JSON.stringify({ action, comments, employee: request.employee.fullName }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${action === "APPROVE" ? "phê duyệt" : "từ chối"} đơn của ${request.employee.fullName} thành công!`,
    });
  } catch (error: any) {
    console.error("Approve request error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý duyệt đơn: " + error.message },
      { status: 500 }
    );
  }
}
