"use client";

import React, { useState, useEffect } from "react";
import { AttendanceWidget } from "@/components/AttendanceWidget";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Clock,
  Calendar,
  ShieldCheck,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export default function AttendancePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringProbe, setTriggeringProbe] = useState(false);

  // Filters & Search
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Add Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMsg, setManualMsg] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkInTime: "08:30",
    checkOutTime: "17:30",
    notes: "Nhân sự thêm công thực tế trực tiếp",
  });

  useEffect(() => {
    fetchHistory();
    fetchEmployeeList();

    const handleUpdate = () => {
      fetchHistory();
    };

    window.addEventListener("attendanceUpdated", handleUpdate);
    return () => {
      window.removeEventListener("attendanceUpdated", handleUpdate);
    };
  }, [selectedEmployeeId]);

  const fetchEmployeeList = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      const json = await res.json();
      if (json.success && json.employees) {
        setEmployees(json.employees);
        if (!manualForm.employeeId && json.employees[0]) {
          setManualForm((prev) => ({ ...prev, employeeId: json.employees[0].id }));
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url =
        selectedEmployeeId && selectedEmployeeId !== "ALL"
          ? `/api/attendance/history?limit=50&employeeId=${selectedEmployeeId}`
          : `/api/attendance/history?limit=50`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setHistory(json.sessions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSendPresenceProbe = async () => {
    try {
      setTriggeringProbe(true);
      const res = await fetch("/api/presence/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expireMinutes: 15, challengeType: "RANDOM" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Đã phát lệnh kiểm tra hiện diện ngẫu nhiên! Vui lòng kiểm tra banner xác thực trên màn hình.");
        window.dispatchEvent(new CustomEvent("attendanceUpdated"));
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert("Lỗi phát lệnh hiện diện: " + e.message);
    } finally {
      setTriggeringProbe(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.date) {
      setManualError("Vui lòng chọn nhân viên và ngày chấm công.");
      return;
    }

    try {
      setManualLoading(true);
      setManualError("");
      setManualMsg("");

      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });

      const data = await res.json();
      if (data.success) {
        setManualMsg(data.message);
        setTimeout(() => {
          setShowManualModal(false);
          setManualMsg("");
        }, 1200);
        await fetchHistory();
        window.dispatchEvent(new CustomEvent("attendanceUpdated"));
      } else {
        setManualError(data.error);
      }
    } catch (e: any) {
      setManualError("Lỗi thêm chấm công thủ công: " + e.message);
    } finally {
      setManualLoading(false);
    }
  };

  // Filter displayed rows based on search
  const filteredHistory = history.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = s.employee?.fullName?.toLowerCase().includes(q);
    const codeMatch = s.employee?.employeeCode?.toLowerCase().includes(q);
    const notesMatch = s.notes?.toLowerCase().includes(q);
    return nameMatch || codeMatch || notesMatch;
  });

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Chấm công & Xác minh Hiện diện
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xác thực đa tầng: Định vị GPS thực tế, Giám sát Geofence & Nhật ký minh bạch
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm công thủ công</span>
          </button>

          <button
            onClick={handleSendPresenceProbe}
            disabled={triggeringProbe}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{triggeringProbe ? "Đang gửi..." : "Thử thách Hiện diện"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Attendance Widget */}
      <AttendanceWidget />

      {/* Monthly Attendance Records Table */}
      <div className="nex-card p-5 space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Nhật ký Chấm công & Dữ liệu Bằng chứng Thực tế
            </h2>
            <p className="text-xs text-slate-500">
              Dữ liệu được lưu trữ trực tiếp trong cơ sở dữ liệu PostgreSQL kèm tọa độ GPS
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Filter */}
            {employees.length > 0 && (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">-- Tất cả nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, mã NV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchHistory}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-blue-600 font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span>Đang tải nhật ký chấm công từ cơ sở dữ liệu...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Chưa có bản ghi chấm công nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Ngày</th>
                  <th className="py-3 px-3">Nhân sự</th>
                  <th className="py-3 px-3">Giờ vào (Check-in)</th>
                  <th className="py-3 px-3">Giờ ra (Check-out)</th>
                  <th className="py-3 px-3">Giờ công</th>
                  <th className="py-3 px-3">Tọa độ GPS / Định vị</th>
                  <th className="py-3 px-3">Hiện diện</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Ghi chú nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((s) => {
                  const checkInEvent = s.events?.find((e: any) => e.eventType === "CHECK_IN");
                  const hasGps = checkInEvent?.latitude !== null && checkInEvent?.latitude !== undefined;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString("vi-VN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{s.employee?.fullName}</div>
                        <div className="text-[10px] text-slate-400 space-x-1">
                          <span>{s.employee?.employeeCode}</span>
                          {s.employee?.department?.name && (
                            <span>• {s.employee.department.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {s.checkInTime ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-emerald-700">
                              {new Date(s.checkInTime).toLocaleTimeString("vi-VN")}
                            </span>
                            {s.isLate ? (
                              <span className="block text-[10px] text-amber-600 font-medium">
                                Muộn {s.lateMinutes}p
                              </span>
                            ) : (
                              <span className="block text-[10px] text-emerald-600 font-medium">
                                Đúng giờ
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {s.checkOutTime ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-blue-700">
                              {new Date(s.checkOutTime).toLocaleTimeString("vi-VN")}
                            </span>
                            {s.isEarlyLeave && (
                              <span className="block text-[10px] text-amber-600 font-medium">
                                Sớm {s.earlyLeaveMinutes}p
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {s.workHours}h
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {hasGps ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] text-slate-700 block">
                              {Number(checkInEvent.latitude).toFixed(4)},{" "}
                              {Number(checkInEvent.longitude).toFixed(4)}
                            </span>
                            <span
                              className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                checkInEvent.geofenceStatus === "INSIDE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {checkInEvent.geofenceStatus === "INSIDE" ? "Trong bán kính" : "Ngoài cơ sở"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Xác nhận hệ thống</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            s.presenceStatus === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-700"
                              : s.presenceStatus === "PARTIAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {s.presenceStatus === "VERIFIED"
                            ? "Đã xác minh"
                            : s.presenceStatus === "PARTIAL"
                            ? "Bán phần"
                            : "Bỏ lỡ"}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-600">
                        {s.notes || "Hợp lệ"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Attendance Modal for HR/Admins */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">Thêm Chấm Công Thủ Công</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            {manualMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{manualMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn nhân viên:</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.department?.name || "Chưa phân phòng"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày chấm công:</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ vào (Check-in):</label>
                  <input
                    type="time"
                    value={manualForm.checkInTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ ra (Check-out):</label>
                  <input
                    type="time"
                    value={manualForm.checkOutTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do / Ghi chú nghiệp vụ:</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Ví dụ: Đi công tác cơ sở, Quên bấm vân tay..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
                >
                  {manualLoading ? "Đang lưu..." : "Lưu vào hệ thống"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
