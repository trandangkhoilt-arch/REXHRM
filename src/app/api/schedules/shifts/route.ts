import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRole, unauthenticatedResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType, ShiftType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const shifts = await prisma.shift.findMany({
      where: { orgId: session.orgId },
      orderBy: { code: "asc" },
      include: {
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json({ success: true, shifts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tải ca làm việc: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    if (!hasRole(session.role, [RoleType.SUPER_ADMIN, RoleType.HR_ADMIN])) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const {
      name,
      code,
      type = ShiftType.ADMINISTRATIVE,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      standardWorkHours = 8.0,
      earlyCheckInToleranceMinutes = 30,
      lateCheckInToleranceMinutes = 15,
      earlyCheckOutToleranceMinutes = 15,
      isOvernight = false,
      requireGps = true,
      requireQr = false,
      requireFace = false,
      allowFlexibleLocation = false,
    } = body;

    if (!name || !code || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ tên, mã ca, giờ bắt đầu và giờ kết thúc." },
        { status: 400 }
      );
    }

    const newShift = await prisma.shift.create({
      data: {
        orgId: session.orgId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        startTime,
        endTime,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        standardWorkHours: Number(standardWorkHours),
        earlyCheckInToleranceMinutes: Number(earlyCheckInToleranceMinutes),
        lateCheckInToleranceMinutes: Number(lateCheckInToleranceMinutes),
        earlyCheckOutToleranceMinutes: Number(earlyCheckOutToleranceMinutes),
        isOvernight: Boolean(isOvernight),
        requireGps: Boolean(requireGps),
        requireQr: Boolean(requireQr),
        requireFace: Boolean(requireFace),
        allowFlexibleLocation: Boolean(allowFlexibleLocation),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo ca làm việc "${newShift.name}" thành công!`,
      shift: newShift,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tạo ca làm việc: " + error.message },
      { status: 500 }
    );
  }
}
