import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthenticatedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExcelBuffer, generateCSVString } from "@/lib/export";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthenticatedResponse();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "xlsx";
    const departmentId = searchParams.get("departmentId");

    const where: any = { orgId: session.orgId };
    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        branch: true,
        user: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    const exportRows = employees.map((e, index) => ({
      STT: index + 1,
      "Mã NV": e.employeeCode,
      "Họ và Tên": e.fullName,
      Email: e.email,
      "Số điện thoại": e.phone || "",
      "Giới tính": e.gender === "MALE" ? "Nam" : e.gender === "FEMALE" ? "Nữ" : "Khác",
      "Phòng ban": e.department.name,
      "Chức vụ": e.position.title,
      "Cơ sở": e.branch.name,
      "Loại hợp đồng": e.contractType,
      "Trạng thái": e.employmentStatus,
      "Chế độ làm việc": e.workMode,
      "Ngày vào làm": new Date(e.joinDate).toLocaleDateString("vi-VN"),
      "Lương cơ bản (VND)": e.baseSalary.toLocaleString("vi-VN"),
    }));

    if (format === "csv") {
      const csvData = generateCSVString(exportRows);
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="danh_sach_nhan_vien_nexhrm.csv"',
        },
      });
    }

    const excelBuffer = generateExcelBuffer(exportRows, "DanhSachNhanVien");
    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="danh_sach_nhan_vien_nexhrm.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Export employees error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xuất danh sách nhân viên: " + error.message },
      { status: 500 }
    );
  }
}
