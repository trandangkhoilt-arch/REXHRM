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

    // 1. Get employee's schedule assignment for today
    let assignment = await prisma.scheduleAssignment.findFirst({
      where: {
        employeeId: session.employee.id,
        workDate: startOfToday,
      },
      include: {
        shift: true,
      },
    });

    // Fallback: If no custom assignment, look up default administrative shift
    let shift: any = assignment?.shift;
    if (!shift) {
      shift = await prisma.shift.findFirst({
        where: {
          orgId: session.orgId,
          type: "ADMINISTRATIVE",
        },
      });
    }

    // 2. Get active branch work locations & geofences
    const branch = await prisma.branch.findUnique({
      where: { id: session.employee.branchId },
      include: {
        workLocations: { where: { isActive: true } },
        qrStations: { where: { isActive: true } },
      },
    });

    // 3. Check existing session today
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        employeeId: session.employee.id,
        date: startOfToday,
      },
      include: {
        events: {
          orderBy: { eventTime: "asc" },
        },
        presenceChallenges: {
          where: { status: "PENDING" },
        },
      },
    });

    const isPrivileged = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "AUDITOR"].includes(session.role as any);
    let employeeList: any[] = [];
    if (isPrivileged) {
      employeeList = await prisma.employee.findMany({
        where: { orgId: session.orgId, employmentStatus: "ACTIVE" },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
        orderBy: { fullName: "asc" },
        take: 100,
      });
    }

    const isDirectorOrAdmin =
      session.role === "SUPER_ADMIN" ||
      session.employee.position?.code === "CEO" ||
      session.employee.department?.code === "BGD";

    return NextResponse.json({
      success: true,
      policy: {
        shift,
        assignment,
        employee: {
          id: session.employee.id,
          employeeCode: session.employee.employeeCode,
          fullName: session.employee.fullName,
          avatarUrl: session.employee.avatarUrl,
          department: session.employee.department?.name || "Chưa phân bổ",
          position: session.employee.position?.title || "Nhân viên",
          branchName: branch?.name || session.employee.branch?.name || "Trụ sở chính",
          email: session.user.email,
          role: session.role,
          canSetOfficeLocation: isDirectorOrAdmin,
        },
        employeeList,
        branch: {
          id: branch?.id,
          name: branch?.name,
          latitude: branch?.latitude,
          longitude: branch?.longitude,
          radiusMeters: branch?.radiusMeters,
          minAccuracyMeters: branch?.minAccuracyMeters,
          workLocations: branch?.workLocations || [],
          qrStations: branch?.qrStations.map((s) => ({
            stationCode: s.stationCode,
            stationName: s.stationName,
            locationDescription: s.locationDescription,
            refreshIntervalSeconds: s.refreshIntervalSeconds,
          })),
        },
        hasCheckedIn: !!existingSession?.checkInTime,
        hasCheckedOut: !!existingSession?.checkOutTime,
        currentSession: existingSession,
        activePresenceChallenge: existingSession?.presenceChallenges?.[0] || null,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Attendance policy error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi lấy chính sách chấm công: " + error.message },
      { status: 500 }
    );
  }
}
