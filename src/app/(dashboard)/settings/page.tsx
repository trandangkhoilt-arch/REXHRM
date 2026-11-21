"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  MapPin,
  QrCode,
  ShieldAlert,
  History,
  CheckCircle2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orgForm, setOrgForm] = useState({
    name: "",
    taxCode: "",
    address: "",
    phone: "",
    email: "",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.organization) {
          setOrgForm({
            name: json.organization.name || "",
            taxCode: json.organization.taxCode || "",
            address: json.organization.address || "",
            phone: json.organization.phone || "",
            email: json.organization.email || "",
            timezone: json.organization.timezone || "Asia/Ho_Chi_Minh",
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchSettings();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Cấu hình Hệ thống & Nhật ký Vận hành
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Quản lý thông tin doanh nghiệp, cơ sở làm việc, tọa độ Geofences, trạm QR động và Audit Logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Organization Info Form */}
        <div className="nex-card p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">Thông tin Tổ chức Doanh nghiệp</h2>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tên tổ chức / Doanh nghiệp *</label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mã số thuế</label>
                <input
                  type="text"
                  value={orgForm.taxCode}
                  onChange={(e) => setOrgForm({ ...orgForm, taxCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Múi giờ</label>
                <input
                  type="text"
                  value={orgForm.timezone}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Địa chỉ trụ sở chính</label>
              <input
                type="text"
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Điện thoại liên hệ</label>
                <input
                  type="text"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email quản trị</label>
                <input
                  type="email"
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Đang lưu..." : "Lưu thay đổi cài đặt"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Branches & Geofence Coordinates */}
        <div className="space-y-4">
          <div className="nex-card p-5 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Cơ sở làm việc & Thiết lập Geofence GPS
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {data?.branches?.map((b: any) => (
                <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{b.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Bán kính: {b.radiusMeters}m
                    </span>
                  </div>
                  <p className="text-slate-500">{b.address}</p>
                  <p className="font-mono text-slate-600 text-[11px]">
                    GPS: {b.latitude}, {b.longitude} (Độ chính xác yêu cầu &le; {b.minAccuracyMeters}m)
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* QR Stations List */}
          <div className="nex-card p-5 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <QrCode className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-800">Trạm Chấm Công QR Động Kiosk</h2>
            </div>

            <div className="space-y-2 text-xs">
              {data?.qrStations?.map((s: any) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{s.stationName}</span>
                    <p className="text-[11px] text-slate-400 font-mono">{s.stationCode}</p>
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                    Xoay mã {s.refreshIntervalSeconds}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="nex-card p-5 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <History className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Nhật ký Hệ thống & Giám sát An toàn (Audit Logs)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Hành động</th>
                <th className="py-2.5 px-3">Đối tượng</th>
                <th className="py-2.5 px-3">Người thực hiện</th>
                <th className="py-2.5 px-3">Chi tiết nghiệp vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {data?.auditLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-bold text-blue-700">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                    {log.entity}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-slate-800">
                    {log.user?.email || "Hệ thống"}
                  </td>
                  <td className="py-2 px-3 max-w-sm truncate text-slate-500 font-sans">
                    {log.details || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
