import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.employee) {
      return unauthenticatedResponse();
    }

    // Chỉ Giám đốc (CEO/Ban Giám Đốc) hoặc Super Admin mới có quyền thiết lập vị trí GPS văn phòng
    const isDirectorOrAdmin =
      session.role === RoleType.SUPER_ADMIN ||
      session.employee.position?.code === "CEO" ||
      session.employee.department?.code === "BGD";

    if (!isDirectorOrAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Quyền hạn bị từ chối: Chỉ Giám đốc / Ban Quản trị cấp cao mới có quyền thiết lập hoặc thay đổi tọa độ GPS văn phòng nhằm ngăn chặn gian lận chấm công.",
        },
        { status: 403 }
      );
    }

    const { latitude, longitude, radiusMeters = 500 } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp tọa độ vĩ độ và kinh độ." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({
      where: { id: session.employee.branchId },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy cơ sở làm việc của nhân viên." },
        { status: 404 }
      );
    }

    const updatedBranch = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Math.max(100, Number(radiusMeters)),
        minAccuracyMeters: 250, // Allow standard browser/device accuracy
      },
    });

    // Also update any child work locations for this branch
    await prisma.workLocation.updateMany({
      where: { branchId: branch.id },
      data: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Math.max(100, Number(radiusMeters)),
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: session.orgId,
        userId: session.userId,
        employeeId: session.employee.id,
        action: "SYNC_BRANCH_LOCATION_GPS",
        entity: "Branch",
        entityId: branch.id,
        details: JSON.stringify({
          branchName: branch.name,
          newLatitude: latitude,
          newLongitude: longitude,
          radiusMeters: updatedBranch.radiusMeters,
          syncedBy: session.employee.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ vị trí cơ sở "${branch.name}" theo tọa độ GPS thực tế của bạn (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) thành công! Giờ đây bạn đang ở ngay tâm văn phòng.`,
      branch: updatedBranch,
    });
  } catch (error: any) {
    console.error("Sync branch location error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi đồng bộ vị trí cơ sở: " + error.message },
      { status: 500 }
    );
  }
}
