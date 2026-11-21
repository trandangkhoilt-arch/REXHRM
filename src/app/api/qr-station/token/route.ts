import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDynamicQRToken } from "@/lib/qr";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stationCode = searchParams.get("stationCode") || "ST_HN_GATE_01";

    const station = await prisma.qRStation.findUnique({
      where: { stationCode },
      include: {
        branch: { select: { name: true, address: true } },
      },
    });

    if (!station || !station.isActive) {
      return NextResponse.json(
        { success: false, error: "Trạm chấm công không tồn tại hoặc đang ngưng hoạt động." },
        { status: 404 }
      );
    }

    const qrData = generateDynamicQRToken(
      station.stationCode,
      station.secretSeed,
      station.refreshIntervalSeconds
    );

    // Update last ping
    await prisma.qRStation.update({
      where: { id: station.id },
      data: {
        lastPingAt: new Date(),
        currentToken: qrData.token,
      },
    });

    return NextResponse.json({
      success: true,
      station: {
        stationCode: station.stationCode,
        stationName: station.stationName,
        locationDescription: station.locationDescription,
        branchName: station.branch.name,
      },
      qr: qrData,
    });
  } catch (error: any) {
    console.error("QR station token error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tạo mã QR trạm: " + error.message },
      { status: 500 }
    );
  }
}
