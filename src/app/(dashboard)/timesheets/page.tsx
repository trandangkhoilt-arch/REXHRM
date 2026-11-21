"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function TimesheetsPage() {
  const [month, setMonth] = useState(11);
  const [year, setYear] = useState(2026);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTimesheets();
  }, [month, year]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/timesheets?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setTimesheets(json.timesheets || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodAction = async (action: "CONFIRM" | "LOCK" | "UNLOCK") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/timesheets/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, action }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchTimesheets();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Summary counters
  const totalStandardDays = timesheets.reduce((acc, t) => acc + t.standardDays, 0);
  const totalActualDays = timesheets.reduce((acc, t) => acc + t.actualDays, 0);
  const totalLateCount = timesheets.reduce((acc, t) => acc + t.lateCount, 0);
  const totalOvertimeHours = timesheets.reduce((acc, t) => acc + t.overtimeHours, 0);

  return (
    <div className="space-y-6">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Bảng công Tổng hợp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tổng hợp dữ liệu công thực tế, đi muộn, về sớm, nghỉ phép và tăng ca
          </p>
        </div>

        {/* Controls: Month/Year selector & Locking */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={() => handlePeriodAction("CONFIRM")}
            disabled={actionLoading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Xác nhận kỳ</span>
          </button>

          <button
            onClick={() => handlePeriodAction("LOCK")}
            disabled={actionLoading}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Khóa kỳ</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tổng công chuẩn kỳ</span>
          <p className="text-xl font-bold text-slate-800">{totalStandardDays} công</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tổng công thực tế</span>
          <p className="text-xl font-bold text-emerald-700">{totalActualDays} công</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tổng lượt đi muộn</span>
          <p className="text-xl font-bold text-amber-600">{totalLateCount} lượt</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tổng giờ tăng ca (OT)</span>
          <p className="text-xl font-bold text-purple-600">{totalOvertimeHours} giờ</p>
        </div>
      </div>

      {/* Timesheet Data Grid */}
      <div className="nex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-3">Phòng ban</th>
                <th className="py-3 px-3 text-center">Công chuẩn</th>
                <th className="py-3 px-3 text-center">Công thực tế</th>
                <th className="py-3 px-3 text-center">Đi muộn (lượt/phút)</th>
                <th className="py-3 px-3 text-center">Về sớm</th>
                <th className="py-3 px-3 text-center">Nghỉ phép</th>
                <th className="py-3 px-3 text-center">Tăng ca</th>
                <th className="py-3 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu bảng công...
                  </td>
                </tr>
              ) : timesheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chưa có dữ liệu bảng công cho tháng {month}/{year}.
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={t.employee?.avatarUrl || "https://i.pravatar.cc/100"}
                          alt={t.employee?.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{t.employee?.fullName}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {t.employee?.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {t.employee?.department?.name}
                    </td>

                    {/* Standard Days */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                      {t.standardDays}
                    </td>

                    {/* Actual Days */}
                    <td className="py-3 px-3 text-center font-bold text-emerald-700 whitespace-nowrap">
                      {t.actualDays}
                    </td>

                    {/* Late Count & Minutes */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {t.lateCount > 0 ? (
                        <span className="font-semibold text-amber-600">
                          {t.lateCount} lần ({t.lateMinutes}p)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Early Leave */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {t.earlyLeaveCount > 0 ? (
                        <span className="font-semibold text-rose-600">
                          {t.earlyLeaveCount} lần
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Paid Leave */}
                    <td className="py-3 px-3 text-center font-medium text-blue-600 whitespace-nowrap">
                      {t.paidLeaveDays > 0 ? `${t.paidLeaveDays} ngày` : "--"}
                    </td>

                    {/* Overtime */}
                    <td className="py-3 px-3 text-center font-bold text-purple-700 whitespace-nowrap">
                      {t.overtimeHours > 0 ? `${t.overtimeHours}h` : "--"}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
