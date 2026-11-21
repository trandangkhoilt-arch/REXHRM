"use client";

import React, { useState, useEffect } from "react";
import { Building2, Users, Plus, X, Briefcase, MapPin } from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", branchId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, setRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/settings"),
      ]);
      const deptJson = await deptRes.json();
      const setJson = await setRes.json();
      if (deptJson.success) setDepartments(deptJson.departments || []);
      if (setJson.success) {
        setBranches(setJson.branches || []);
        if (setJson.branches?.[0]) setFormData((p) => ({ ...p, branchId: setJson.branches[0].id }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowAddModal(false);
        setFormData({ name: "", code: "", branchId: branches[0]?.id || "" });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Phòng ban & Cơ cấu Tổ chức
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sơ đồ phòng ban, phân bổ nhân sự và trưởng bộ phận phụ trách
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phòng ban mới</span>
        </button>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Đang tải phòng ban...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="nex-card p-5 nex-card-hover space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{d.branch?.name || "Toàn công ty"}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mt-2">{d.name}</h3>
              </div>

              {/* Manager Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2.5">
                <img
                  src={d.manager?.avatarUrl || "https://i.pravatar.cc/100?u=" + d.code}
                  alt="Trưởng phòng"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 block">Trưởng bộ phận:</span>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {d.manager?.fullName || "Chưa bổ nhiệm"}
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1.5 font-medium">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{d._count?.employees || 0} nhân sự</span>
                </div>
                <div className="flex items-center space-x-1.5 font-medium">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>{d._count?.positions || 0} chức danh</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Department */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tạo phòng ban mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên phòng ban *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kinh doanh quốc tế"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mã phòng ban *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="KDQT"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trực thuộc cơ sở</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {submitting ? "Đang lưu..." : "Tạo phòng ban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
