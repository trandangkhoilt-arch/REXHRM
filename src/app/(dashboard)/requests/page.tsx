"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("mine"); // "mine" | "to_approve" | "balances" | "holidays"
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // New Request Form
  const [formData, setFormData] = useState({
    requestType: "ANNUAL_LEAVE",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    durationDays: 1,
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests?tab=${activeTab}`);
      const json = await res.json();
      if (json.success) {
        if (activeTab === "balances") setBalances(json.balances || []);
        else if (activeTab === "holidays") setHolidays(json.holidays || []);
        else setRequests(json.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowAddModal(false);
        setFormData({
          requestType: "ANNUAL_LEAVE",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          durationDays: 1,
          reason: "",
        });
        fetchTabData();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi gửi đơn: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (action: "APPROVE" | "REJECT") => {
    if (!selectedReq) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/requests/${selectedReq.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments: approvalComment }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowApprovalModal(false);
        setSelectedReq(null);
        setApprovalComment("");
        fetchTabData();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi duyệt đơn: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Đơn từ & Phê duyệt
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gửi đơn xin nghỉ phép, công tác, WFH, giải trình đi muộn và quy trình duyệt tự động
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn mới</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("mine")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "mine"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Đơn của tôi
        </button>
        <button
          onClick={() => setActiveTab("to_approve")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "to_approve"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Chờ tôi duyệt
        </button>
        <button
          onClick={() => setActiveTab("balances")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "balances"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Số dư phép năm
        </button>
        <button
          onClick={() => setActiveTab("holidays")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "holidays"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Lịch nghỉ lễ công ty
        </button>
      </div>

      {/* Tab 1 & Tab 2: Requests Table */}
      {(activeTab === "mine" || activeTab === "to_approve") && (
        <div className="nex-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Loại đơn</th>
                  {activeTab === "to_approve" && <th className="py-3 px-3">Người gửi</th>}
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Số ngày</th>
                  <th className="py-3 px-3">Lý do</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Đang tải danh sách đơn từ...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không có đơn từ nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                        {r.requestType === "ANNUAL_LEAVE"
                          ? "Nghỉ phép năm"
                          : r.requestType === "SICK_LEAVE"
                          ? "Nghỉ ốm"
                          : r.requestType === "REMOTE_WORK"
                          ? "Làm việc từ xa (WFH)"
                          : r.requestType === "BUSINESS_TRIP"
                          ? "Đi công tác"
                          : r.requestType}
                      </td>

                      {activeTab === "to_approve" && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{r.employee?.fullName}</p>
                          <span className="text-[10px] text-slate-400">{r.employee?.department?.name}</span>
                        </td>
                      )}

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                        {new Date(r.startDate).toLocaleDateString("vi-VN")} &rarr;{" "}
                        {new Date(r.endDate).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-800">
                        {r.durationDays} ngày
                      </td>

                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {r.reason}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {activeTab === "to_approve" && r.status === "PENDING" && (
                          <button
                            onClick={() => {
                              setSelectedReq(r);
                              setShowApprovalModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors"
                          >
                            Xét duyệt
                          </button>
                        )}
                        {r.reviewedBy && (
                          <span className="text-[10px] text-slate-400">
                            Bởi {r.reviewedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Balances */}
      {activeTab === "balances" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balances.map((b) => (
            <div key={b.id} className="nex-card p-5 space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase">
                {b.leaveType?.name || "Nghỉ phép năm"}
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-slate-800">{b.remainingDays}</span>
                  <span className="text-xs text-slate-400 ml-1">ngày còn lại</span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Tổng hạn mức: {b.totalDays} ngày</p>
                  <p>Đã sử dụng: {b.usedDays} ngày</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Company Holidays */}
      {activeTab === "holidays" && (
        <div className="nex-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Lịch nghỉ lễ và sự kiện toàn công ty</h3>
          <p className="text-xs text-slate-500">
            Các ngày nghỉ lễ theo quy định của Bộ luật Lao động Việt Nam
          </p>
          <div className="divide-y divide-slate-100 pt-2 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800">Tết Dương Lịch</span>
              <span className="text-slate-500 font-mono">01/01/2026</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800">Tết Nguyên Đán Bính Ngọ</span>
              <span className="text-slate-500 font-mono">15/02/2026 - 21/02/2026 (7 ngày)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800">Giỗ Tổ Hùng Vương</span>
              <span className="text-slate-500 font-mono">26/04/2026</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800">Ngày Giải phóng & Quốc tế Lao động</span>
              <span className="text-slate-500 font-mono">30/04/2026 - 01/05/2026</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800">Quốc khánh</span>
              <span className="text-slate-500 font-mono">02/09/2026 - 03/09/2026</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Request */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tạo đơn yêu cầu mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Loại đơn *</label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                >
                  <option value="ANNUAL_LEAVE">Nghỉ phép năm</option>
                  <option value="SICK_LEAVE">Nghỉ ốm hưởng BHXH</option>
                  <option value="UNPAID_LEAVE">Nghỉ không lương</option>
                  <option value="REMOTE_WORK">Làm việc từ xa (WFH)</option>
                  <option value="BUSINESS_TRIP">Đi công tác</option>
                  <option value="LATE_ARRIVAL">Xin đi muộn</option>
                  <option value="EARLY_LEAVE">Xin về sớm</option>
                  <option value="OVERTIME">Đăng ký làm thêm giờ (OT)</option>
                  <option value="ATTENDANCE_ADJUSTMENT">Bổ sung chấm công (quên check-in/out)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đến ngày *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Số ngày</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lý do chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Nêu rõ lý do giải trình để cấp trên phê duyệt..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
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
                  {submitting ? "Đang gửi..." : "Gửi đơn duyệt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Approval Action */}
      {showApprovalModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Xét duyệt đơn từ</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
              <p>
                <span className="text-slate-400">Nhân sự gửi:</span>{" "}
                <strong className="text-slate-800">{selectedReq.employee?.fullName}</strong>
              </p>
              <p>
                <span className="text-slate-400">Loại đơn:</span>{" "}
                <span className="font-semibold text-blue-600">{selectedReq.requestType}</span>
              </p>
              <p>
                <span className="text-slate-400">Thời gian:</span>{" "}
                <span>
                  {new Date(selectedReq.startDate).toLocaleDateString("vi-VN")} đến{" "}
                  {new Date(selectedReq.endDate).toLocaleDateString("vi-VN")} ({selectedReq.durationDays} ngày)
                </span>
              </p>
              <p>
                <span className="text-slate-400">Lý do:</span> <em>"{selectedReq.reason}"</em>
              </p>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">Ghi chú phê duyệt</label>
              <textarea
                rows={2}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Ý kiến chỉ đạo hoặc lý do từ chối (nếu có)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => handleApprove("REJECT")}
                disabled={submitting}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-colors"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleApprove("APPROVE")}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 transition-colors"
              >
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
