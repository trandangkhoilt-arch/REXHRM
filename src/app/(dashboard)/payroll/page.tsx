"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Calculator,
  Lock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function PayrollPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchItems(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payroll/periods");
      const json = await res.json();
      if (json.success && json.periods?.length > 0) {
        setPeriods(json.periods);
        setSelectedPeriodId(json.periods[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (pId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll/items?periodId=${pId}`);
      const json = await res.json();
      if (json.success) {
        setPayrollItems(json.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriodId) return;
    try {
      setCalculating(true);
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPeriods();
        fetchItems(selectedPeriodId);
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi tính lương: " + e.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!selectedPeriodId) return;
    try {
      const res = await fetch("/api/payroll/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId, action: "APPROVE" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPeriods();
        fetchItems(selectedPeriodId);
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi phê duyệt: " + e.message);
    }
  };

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Bảng lương & Chi trả (C&B)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tính toán tự động theo bảng công đã chốt, khấu trừ BHXH, thuế TNCN và phiếu lương điện tử
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-blue-500"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodName} ({p.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleCalculatePayroll}
            disabled={calculating}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? "Đang tính..." : "Tính toán lương"}</span>
          </button>

          <button
            onClick={handleApprovePayroll}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Duyệt & Phát hành</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {currentPeriod && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="nex-card p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Trạng thái kỳ lương</span>
            <div>
              <StatusBadge status={currentPeriod.status} />
            </div>
          </div>
          <div className="nex-card p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Số nhân sự chi trả</span>
            <p className="text-xl font-bold text-slate-800">{payrollItems.length} người</p>
          </div>
          <div className="nex-card p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Tổng quỹ lương Gross</span>
            <p className="text-xl font-bold text-slate-800">
              {currentPeriod.totalGrossSalary?.toLocaleString("vi-VN")} đ
            </p>
          </div>
          <div className="nex-card p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Tổng thực lĩnh (Net)</span>
            <p className="text-xl font-bold text-emerald-700">
              {currentPeriod.totalNetSalary?.toLocaleString("vi-VN")} đ
            </p>
          </div>
        </div>
      )}

      {/* Payroll Items Table */}
      <div className="nex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-3">Phòng ban</th>
                <th className="py-3 px-3 text-right">Lương cơ bản</th>
                <th className="py-3 px-3 text-center">Ngày công</th>
                <th className="py-3 px-3 text-right">Lương thực tế</th>
                <th className="py-3 px-3 text-right">Tăng ca (OT)</th>
                <th className="py-3 px-3 text-right">Bảo hiểm (10.5%)</th>
                <th className="py-3 px-3 text-right">Thuế TNCN</th>
                <th className="py-3 px-3 text-right">Thực lĩnh (NET)</th>
                <th className="py-3 px-4 text-center">Phiếu lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu bảng lương...
                  </td>
                </tr>
              ) : payrollItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Kỳ này chưa được tính toán lương. Hãy bấm "Tính toán lương" ở trên để khởi chạy bộ tính lương.
                  </td>
                </tr>
              ) : (
                payrollItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={item.employee?.avatarUrl || "https://i.pravatar.cc/100"}
                          alt={item.employee?.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{item.employee?.fullName}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.employee?.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {item.employee?.department?.name}
                    </td>

                    {/* Base Salary */}
                    <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      {item.baseSalary.toLocaleString("vi-VN")} đ
                    </td>

                    {/* Work Days */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                      {item.actualWorkDays} / {item.standardWorkDays}
                    </td>

                    {/* Actual Salary */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {item.actualWorkSalary.toLocaleString("vi-VN")} đ
                    </td>

                    {/* OT Pay */}
                    <td className="py-3 px-3 text-right font-medium text-purple-700 whitespace-nowrap">
                      {item.overtimePay > 0 ? `${item.overtimePay.toLocaleString("vi-VN")} đ` : "--"}
                    </td>

                    {/* Insurance deductions */}
                    <td className="py-3 px-3 text-right font-medium text-rose-600 whitespace-nowrap">
                      -
                      {(
                        item.socialInsurance +
                        item.healthInsurance +
                        item.unemploymentInsurance
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </td>

                    {/* Tax */}
                    <td className="py-3 px-3 text-right font-medium text-amber-600 whitespace-nowrap">
                      {item.personalIncomeTax > 0
                        ? `-${item.personalIncomeTax.toLocaleString("vi-VN")} đ`
                        : "0 đ"}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap text-sm">
                      {item.netSalary.toLocaleString("vi-VN")} đ
                    </td>

                    {/* View Slip */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowSlipModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                        title="Xem phiếu lương"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Individual Salary Slip (Phiếu Lương Cá Nhân) */}
      {showSlipModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Phiếu Lương Điện Tử (Payslip)
                </h3>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Information */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-sm text-slate-800">{selectedItem.employee?.fullName}</p>
                <p className="text-slate-500">
                  {selectedItem.employee?.position?.title} &bull; {selectedItem.employee?.department?.name}
                </p>
                <span className="font-mono text-blue-600">{selectedItem.employee?.employeeCode}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Kỳ trả lương:</span>
                <span className="font-semibold text-slate-700">
                  Tháng {selectedItem.payrollPeriod?.month}/{selectedItem.payrollPeriod?.year}
                </span>
              </div>
            </div>

            {/* Income & Deduction Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                I. Thu nhập & Phụ cấp
              </div>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 px-3 py-1">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Lương cơ bản hợp đồng:</span>
                  <span className="font-semibold">{selectedItem.baseSalary?.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">
                    Lương theo ngày công thực tế ({selectedItem.actualWorkDays} / {selectedItem.standardWorkDays} ngày):
                  </span>
                  <span className="font-semibold">{selectedItem.actualWorkSalary?.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Làm thêm giờ (Tăng ca OT):</span>
                  <span className="font-semibold">{selectedItem.overtimePay?.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Phụ cấp công việc:</span>
                  <span className="font-semibold">{selectedItem.allowances?.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>

              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] pt-2">
                II. Các khoản trích nộp theo lương
              </div>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 px-3 py-1">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Bảo hiểm xã hội (BHXH 8%):</span>
                  <span className="text-rose-600 font-semibold">
                    -{selectedItem.socialInsurance?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Bảo hiểm y tế (BHYT 1.5%):</span>
                  <span className="text-rose-600 font-semibold">
                    -{selectedItem.healthInsurance?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Bảo hiểm thất nghiệp (BHTN 1%):</span>
                  <span className="text-rose-600 font-semibold">
                    -{selectedItem.unemploymentInsurance?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Thuế thu nhập cá nhân (TNCN):</span>
                  <span className="text-amber-600 font-semibold">
                    -{selectedItem.personalIncomeTax?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Total Net Salary Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800">THỰC LĨNH CHUYỂN KHOẢN (NET)</span>
                <p className="text-[10px] text-emerald-600">Đã bao gồm tất cả các khoản khấu trừ luật định</p>
              </div>
              <div className="text-xl font-black text-emerald-700">
                {selectedItem.netSalary?.toLocaleString("vi-VN")} VND
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
