"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  Edit,
  Building2,
  Phone,
  Mail,
  RefreshCw,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New employee form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "1995-01-01",
    departmentId: "",
    positionId: "",
    branchId: "",
    contractType: "OFFICIAL",
    workMode: "OFFICE",
    baseSalary: 15000000,
    role: "EMPLOYEE",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchMetadata();
  }, [search, selectedDept, selectedStatus, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search,
      });
      if (selectedDept) params.set("departmentId", selectedDept);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, setRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/settings"),
      ]);
      const deptData = await deptRes.json();
      const setData = await setRes.json();
      if (deptData.success) {
        setDepartments(deptData.departments || []);
        if (deptData.departments?.[0] && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: deptData.departments[0].id }));
        }
      }
      if (setData.success) {
        setBranches(setData.branches || []);
        if (setData.branches?.[0] && !formData.branchId) {
          setFormData((prev) => ({ ...prev, branchId: setData.branches[0].id }));
        }
      }
    } catch {}
  };

  const handleToggleLock = async (empId: string) => {
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_USER_LOCK" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchEmployees();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError("");

      // Default position if empty
      let posId = formData.positionId;
      if (!posId && departments[0]) {
        // Find position or use fallback
        const dept = departments.find((d) => d.id === formData.departmentId);
        posId = dept?.positions?.[0]?.id || departments[0]?.positions?.[0]?.id;
      }

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          positionId: posId || departments[0]?.id, // fallback handled by server
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddModal(false);
        fetchEmployees();
      } else {
        setFormError(data.error);
      }
    } catch (err: any) {
      setFormError("Lỗi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Nhân sự
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tổng số: <span className="font-bold text-blue-600">{pagination.total}</span> nhân sự trong tổ chức
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/employees/export?format=xlsx"
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </a>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="nex-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm theo họ tên, mã NV (NEX-xxx), email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="PROBATION">Thử việc</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="RESIGNED">Đã thôi việc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="nex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-3">Phòng ban & Vị trí</th>
                <th className="py-3 px-3">Cơ sở</th>
                <th className="py-3 px-3">Liên hệ</th>
                <th className="py-3 px-3">Hợp đồng</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3">Tài khoản</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy nhân viên phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          src={e.avatarUrl || "https://i.pravatar.cc/100"}
                          alt={e.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer">
                            {e.fullName}
                          </p>
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {e.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="font-semibold text-slate-800">{e.department?.name}</p>
                      <p className="text-[11px] text-slate-400">{e.position?.title}</p>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {e.branch?.name}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="text-slate-700 flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{e.email}</span>
                      </p>
                      {e.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{e.phone}</span>
                        </p>
                      )}
                    </td>

                    {/* Contract */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={e.contractType} />
                    </td>

                    {/* Employment Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={e.employmentStatus} />
                    </td>

                    {/* User Role & Login Lock */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <StatusBadge status={e.user?.role || "EMPLOYEE"} />
                        {e.user?.status === "SUSPENDED" && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                            Bị khóa
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setSelectedEmp(e);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(e.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            e.user?.status === "ACTIVE"
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-rose-600 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={e.user?.status === "ACTIVE" ? "Khóa đăng nhập" : "Mở khóa"}
                        >
                          {e.user?.status === "ACTIVE" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Trang {pagination.page} / {pagination.totalPages || 1} ({pagination.total} nhân viên)
          </span>
          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 font-medium"
            >
              Trước
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 font-medium"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm nhân viên mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Họ đệm *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nguyễn Văn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="An"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email công việc *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="an.nguyen@nexhrm.vn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phòng ban *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
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
                  <label className="font-semibold text-slate-700 block mb-1">Cơ sở làm việc *</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Loại hợp đồng</label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  >
                    <option value="OFFICIAL">Chính thức</option>
                    <option value="PROBATION">Thử việc</option>
                    <option value="INTERN">Thực tập sinh</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lương cơ bản (VND)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                  />
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? "Đang lưu..." : "Lưu nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Employee Details */}
      {showDetailModal && selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Chi tiết Hồ sơ Nhân sự</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <img
                src={selectedEmp.avatarUrl || "https://i.pravatar.cc/100"}
                alt={selectedEmp.fullName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <h4 className="text-base font-bold text-slate-800">{selectedEmp.fullName}</h4>
                <p className="text-xs text-slate-500">{selectedEmp.position?.title} &bull; {selectedEmp.department?.name}</p>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                    {selectedEmp.employeeCode}
                  </span>
                  <StatusBadge status={selectedEmp.employmentStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="font-semibold text-slate-800">{selectedEmp.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Số điện thoại:</span>
                <p className="font-semibold text-slate-800">{selectedEmp.phone || "Chưa cập nhật"}</p>
              </div>
              <div>
                <span className="text-slate-400">Cơ sở làm việc:</span>
                <p className="font-semibold text-slate-800">{selectedEmp.branch?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Chế độ làm việc:</span>
                <p className="font-semibold text-slate-800">{selectedEmp.workMode}</p>
              </div>
              <div>
                <span className="text-slate-400">Ngày vào làm:</span>
                <p className="font-semibold text-slate-800">
                  {new Date(selectedEmp.joinDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Lương cơ bản:</span>
                <p className="font-bold text-emerald-700">
                  {selectedEmp.baseSalary?.toLocaleString("vi-VN")} VND
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
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
