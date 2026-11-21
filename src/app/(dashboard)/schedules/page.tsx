"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  Filter,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function SchedulesPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New shift form
  const [shiftForm, setShiftForm] = useState({
    name: "",
    code: "",
    type: "ADMINISTRATIVE",
    startTime: "08:30",
    endTime: "17:30",
    standardWorkHours: 8.0,
    lateCheckInToleranceMinutes: 15,
    earlyCheckOutToleranceMinutes: 15,
    isOvernight: false,
    requireGps: true,
    requireQr: false,
  });

  // Assign form
  const [assignForm, setAssignForm] = useState({
    shiftId: "",
    departmentId: "",
    dates: [new Date().toISOString().slice(0, 10)],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftRes, assignRes, deptRes] = await Promise.all([
        fetch("/api/schedules/shifts"),
        fetch("/api/schedules/assignments"),
        fetch("/api/departments"),
      ]);
      const sJson = await shiftRes.json();
      const aJson = await assignRes.json();
      const dJson = await deptRes.json();

      if (sJson.success) {
        setShifts(sJson.shifts || []);
        if (sJson.shifts?.[0]) setAssignForm((p) => ({ ...p, shiftId: sJson.shifts[0].id }));
      }
      if (aJson.success) setAssignments(aJson.assignments || []);
      if (dJson.success) {
        setDepartments(dJson.departments || []);
        if (dJson.departments?.[0]) setAssignForm((p) => ({ ...p, departmentId: dJson.departments[0].id }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/schedules/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shiftForm),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowAddShiftModal(false);
        fetchData();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/schedules/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: assignForm.shiftId,
          departmentId: assignForm.departmentId,
          startDates: assignForm.dates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowAssignModal(false);
        fetchData();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Ca & Phân bổ Lịch làm việc
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cấu hình thời gian làm việc, chính sách dung sai đi muộn và xếp ca linh hoạt
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Phân ca hàng loạt</span>
          </button>
          <button
            onClick={() => setShowAddShiftModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo ca làm mới</span>
          </button>
        </div>
      </div>

      {/* Shifts Card Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Danh mục Các loại Ca làm việc ({shifts.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((s) => (
            <div key={s.id} className="nex-card p-4 nex-card-hover space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {s.code}
                </span>
                {s.isOvernight && (
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    Ca qua đêm 🌙
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm">{s.name}</h3>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">
                  {s.startTime} &rarr; {s.endTime} ({s.standardWorkHours}h công)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                <div>
                  <span className="text-slate-400">Dung sai trễ:</span>
                  <p className="font-semibold">{s.lateCheckInToleranceMinutes} phút</p>
                </div>
                <div>
                  <span className="text-slate-400">Yêu cầu GPS:</span>
                  <p className="font-semibold">{s.requireGps ? "Bắt buộc" : "Không"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Yêu cầu QR:</span>
                  <p className="font-semibold">{s.requireQr ? "Bắt buộc" : "Không"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Nhân sự áp dụng:</span>
                  <p className="font-semibold">{s._count?.assignments || 0} lượt</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Assignments Calendar View */}
      <div className="nex-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Lịch làm việc đã phân bổ trong tháng
            </h2>
            <p className="text-xs text-slate-500">
              Danh sách nhân sự và ca làm tương ứng theo từng ngày
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {assignments.length} lượt phân ca
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Ngày làm việc</th>
                <th className="py-3 px-3">Nhân sự</th>
                <th className="py-3 px-3">Phòng ban</th>
                <th className="py-3 px-3">Ca được phân</th>
                <th className="py-3 px-3">Thời gian ca</th>
                <th className="py-3 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assignments.slice(0, 20).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {new Date(a.workDate).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                    {a.employee?.fullName} ({a.employee?.employeeCode})
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {a.employee?.department?.name}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-bold text-blue-700">
                    {a.shift?.name}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono">
                    {a.shift?.startTime} - {a.shift?.endTime}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Shift */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tạo ca làm việc mới</h3>
              <button
                onClick={() => setShowAddShiftModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tên ca *</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    placeholder="Ca sáng thứ Bảy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã ca *</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.code}
                    onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                    placeholder="CA_T7"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giờ công chuẩn</label>
                  <input
                    type="number"
                    step="0.5"
                    value={shiftForm.standardWorkHours}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, standardWorkHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dung sai muộn (phút)</label>
                  <input
                    type="number"
                    value={shiftForm.lateCheckInToleranceMinutes}
                    onChange={(e) =>
                      setShiftForm({
                        ...shiftForm,
                        lateCheckInToleranceMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftForm.isOvernight}
                    onChange={(e) => setShiftForm({ ...shiftForm, isOvernight: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Ca qua đêm (vượt qua 00:00)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftForm.requireGps}
                    onChange={(e) => setShiftForm({ ...shiftForm, requireGps: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Bắt buộc định vị GPS trong bán kính văn phòng</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftForm.requireQr}
                    onChange={(e) => setShiftForm({ ...shiftForm, requireQr: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Bắt buộc quét mã QR động tại trạm kiosk</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? "Đang lưu..." : "Lưu ca làm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Assign Shifts */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Phân ca hàng loạt theo phòng ban</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchAssign} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phòng ban áp dụng *</label>
                <select
                  value={assignForm.departmentId}
                  onChange={(e) => setAssignForm({ ...assignForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ca làm việc *</label>
                <select
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ngày làm việc *</label>
                <input
                  type="date"
                  required
                  value={assignForm.dates[0]}
                  onChange={(e) => setAssignForm({ ...assignForm, dates: [e.target.value] })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                >
                  {submitting ? "Đang phân ca..." : "Xác nhận phân ca"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
