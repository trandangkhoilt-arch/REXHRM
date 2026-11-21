import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");
    const departmentIdParam = searchParams.get("departmentId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const isPrivileged = [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.MANAGER, RoleType.AUDITOR].includes(session.role as any);

    const whereClause: any = {};

    // Standard employees can strictly only access their own history
    if (!isPrivileged) {
      whereClause.employeeId = session.employee.id;
    } else if (employeeIdParam && employeeIdParam !== "ALL" && employeeIdParam !== "") {
      whereClause.employeeId = employeeIdParam;
    }

    if (departmentIdParam && departmentIdParam !== "ALL" && departmentIdParam !== "") {
      whereClause.employee = { ...whereClause.employee, departmentId: departmentIdParam };
    }

    if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [total, sessions] = await Promise.all([
      prisma.attendanceSession.count({ where: whereClause }),
      prisma.attendanceSession.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              avatarUrl: true,
              department: { select: { name: true } },
              position: { select: { title: true } },
            },
          },
          events: {
            orderBy: { eventTime: "asc" },
            include: { evidence: true },
          },
          presenceChallenges: true,
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      sessions,
    });
  } catch (error: any) {
    console.error("Attendance history error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi lấy lịch sử chấm công: " + error.message },
      { status: 500 }
    );
  }
}
