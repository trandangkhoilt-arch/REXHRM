"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  RefreshCw,
  Search,
  X,
  FileCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function FraudDetectionPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveStatus, setResolveStatus] = useState("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, [statusFilter]);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/fraud/flags?status=${statusFilter}` : "/api/fraud/flags";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setFlags(json.flags || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlag) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/fraud/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagId: selectedFlag.id,
          status: resolveStatus,
          resolutionNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowResolveModal(false);
        setSelectedFlag(null);
        setResolutionNotes("");
        fetchFlags();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi xử lý: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = flags.filter((f) => f.status === "OPEN").length;
  const investigatingCount = flags.filter((f) => f.status === "INVESTIGATING").length;
  const resolvedCount = flags.filter((f) => f.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Trung tâm Phát hiện Gian lận Chấm công
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Giám sát vi phạm vị trí GPS, giả mạo QR động, bỏ lỡ kiểm tra hiện diện và thiếu lượt check-out
          </p>
        </div>

        <button
          onClick={fetchFlags}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tổng cảnh báo ghi nhận</span>
          <p className="text-xl font-bold text-slate-800">{flags.length}</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Đang chờ xử lý (Open)</span>
          <p className="text-xl font-bold text-rose-600">{openCount}</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Đang đối soát giải trình</span>
          <p className="text-xl font-bold text-amber-600">{investigatingCount}</p>
        </div>
        <div className="nex-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Đã kết luận / Giải quyết</span>
          <p className="text-xl font-bold text-emerald-700">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-500 font-semibold">Lọc theo trạng thái:</span>
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            statusFilter === "" ? "bg-blue-600 text-white" : "bg-white border text-slate-700"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setStatusFilter("OPEN")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            statusFilter === "OPEN" ? "bg-rose-600 text-white" : "bg-white border text-slate-700"
          }`}
        >
          Chờ xử lý ({openCount})
        </button>
        <button
          onClick={() => setStatusFilter("INVESTIGATING")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            statusFilter === "INVESTIGATING" ? "bg-amber-600 text-white" : "bg-white border text-slate-700"
          }`}
        >
          Đang đối soát ({investigatingCount})
        </button>
        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            statusFilter === "RESOLVED" ? "bg-emerald-600 text-white" : "bg-white border text-slate-700"
          }`}
        >
          Đã giải quyết ({resolvedCount})
        </button>
      </div>

      {/* Risk Flags Table */}
      <div className="nex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-3">Nhân sự liên quan</th>
                <th className="py-3 px-3">Loại bất thường</th>
                <th className="py-3 px-3">Mức độ rủi ro</th>
                <th className="py-3 px-3">Mô tả hành vi</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách cảnh báo...
                  </td>
                </tr>
              ) : flags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không có cảnh báo gian lận nào trong hệ thống!
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(flag.createdAt).toLocaleString("vi-VN")}
                    </td>

                    {/* Employee Profile */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <img
                          src={flag.employee?.avatarUrl || "https://i.pravatar.cc/100"}
                          alt={flag.employee?.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{flag.employee?.fullName}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {flag.employee?.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Risk Type */}
                    <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                      {flag.riskType === "OFF_LOCATION"
                        ? "Ngoài bán kính GPS"
                        : flag.riskType === "MISSED_PRESENCE"
                        ? "Bỏ lỡ xác minh hiện diện"
                        : flag.riskType === "NO_CHECKOUT"
                        ? "Không có Check-out"
                        : flag.riskType === "EXPIRED_QR"
                        ? "QR hết hạn/sử dụng lại"
                        : flag.riskType}
                    </td>

                    {/* Severity & Score */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <StatusBadge status={flag.severity} />
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          ({flag.riskScore}đ)
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3 max-w-sm text-slate-600 leading-relaxed text-[11px]">
                      {flag.description}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={flag.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setResolveStatus(flag.status === "OPEN" ? "RESOLVED" : flag.status);
                          setResolutionNotes(flag.resolutionNotes || "");
                          setShowResolveModal(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors text-xs"
                      >
                        Xem & Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Review and Resolve Risk Flag */}
      {showResolveModal && selectedFlag && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Đối soát Cảnh báo Bất thường
                </h3>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flag Details Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{selectedFlag.employee?.fullName} ({selectedFlag.employee?.employeeCode})</span>
                <StatusBadge status={selectedFlag.severity} />
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedFlag.description}
              </p>
              {selectedFlag.evidence && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                    Dữ liệu bằng chứng kỹ thuật (Server Evidence):
                  </span>
                  <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedFlag.evidence), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <form onSubmit={handleResolveFlag} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cập nhật trạng thái đối soát *
                </label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-medium"
                >
                  <option value="INVESTIGATING">Đang đối soát / Chờ giải trình của nhân viên</option>
                  <option value="RESOLVED">Đã giải quyết (Có giải trình hợp lệ hoặc đã xử lý kỷ luật)</option>
                  <option value="DISMISSED">Bỏ qua cảnh báo (Sai số thiết bị / Ngoại lệ kỹ thuật)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kết luận & Ghi chú xử lý của Quản lý / HR *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Nhập căn cứ xử lý, đối soát giải trình của nhân viên..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? "Đang lưu..." : "Lưu kết luận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
