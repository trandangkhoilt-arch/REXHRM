"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  FileText,
  Lock,
  Smartphone,
  Calendar,
  Building,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  KeyRound,
  History,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "work" | "security"
  const [profile, setProfile] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Password form
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState("");
  const [passError, setPassError] = useState("");

  // Contact info edit form
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
        setPhone(json.profile?.phone || "");
        setRecentActivity(json.recentActivity || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setEditingPhone(false);
        fetchProfile();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassMessage("");

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setPassLoading(true);
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPassMessage(json.message);
        setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPassError(json.error);
      }
    } catch (e: any) {
      setPassError("Lỗi đổi mật khẩu: " + e.message);
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Đang tải hồ sơ cá nhân...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="nex-card p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
        <img
          src={profile?.avatarUrl || "https://i.pravatar.cc/150"}
          alt={profile?.fullName}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
        />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-extrabold text-slate-800">{profile?.fullName}</h1>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {profile?.employeeCode}
            </span>
            <StatusBadge status={profile?.employmentStatus || "ACTIVE"} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {profile?.position?.title} &bull; {profile?.department?.name} &bull; {profile?.branch?.name}
          </p>
          <p className="text-xs text-slate-400">
            Ngày gia nhập: {new Date(profile?.joinDate).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* 3 Tabs Bar (Section XII) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Tổng quan hồ sơ</span>
        </button>
        <button
          onClick={() => setActiveTab("work")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === "work"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>2. Công việc & Hợp đồng</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`py-2 px-4 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>3. Bảo mật & Phiên đăng nhập</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="nex-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Thông tin Cá nhân & Liên hệ
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Họ và tên:</span>
                <p className="font-semibold text-slate-800">{profile?.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email tài khoản:</span>
                <p className="font-semibold text-slate-800">{profile?.email}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Số điện thoại liên hệ:</span>
                {editingPhone ? (
                  <div className="flex space-x-2 mt-1">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={handleUpdatePhone}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingPhone(false)}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-slate-800">{profile?.phone || "Chưa cập nhật"}</p>
                    <button
                      onClick={() => setEditingPhone(true)}
                      className="text-blue-600 hover:underline text-[11px] font-medium"
                    >
                      Thay đổi
                    </button>
                  </div>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                <p className="font-semibold text-slate-800">
                  {profile?.gender === "MALE" ? "Nam" : "Nữ"}
                </p>
              </div>
            </div>
          </div>

          <div className="nex-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Vị trí Công tác & Tổ chức
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Phòng ban phụ trách:</span>
                <p className="font-semibold text-slate-800">{profile?.department?.name}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Chức danh / Vị trí:</span>
                <p className="font-semibold text-slate-800">{profile?.position?.title}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Cơ sở văn phòng:</span>
                <p className="font-semibold text-slate-800">{profile?.branch?.name}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Quản lý trực tiếp:</span>
                <p className="font-semibold text-slate-800">
                  {profile?.manager?.fullName ? `${profile.manager.fullName} (${profile.manager.employeeCode})` : "Ban Giám Đốc"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work & Contracts */}
      {activeTab === "work" && (
        <div className="nex-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Hợp đồng Lao động & Thông số ca làm việc
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Hợp đồng lao động</span>
              <p>Loại hợp đồng: <strong>{profile?.contractType}</strong></p>
              <p>Chế độ làm việc: <strong>{profile?.workMode}</strong></p>
              <p>Ngày bắt đầu: <strong>{new Date(profile?.joinDate).toLocaleDateString("vi-VN")}</strong></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Chính sách chấm công áp dụng</span>
              <p>Yêu cầu GPS: <strong>Bán kính {profile?.branch?.radiusMeters || 150}m</strong></p>
              <p>Xác thực trạm QR: <strong>Áp dụng khi vào cơ sở</strong></p>
              <p>Giám sát hiện diện: <strong>Thử thách ngẫu nhiên trong ca</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Passkeys */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Change Password Card */}
          <div className="nex-card p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Đổi mật khẩu tài khoản</h3>
            </div>

            {passMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                {passMessage}
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                {passLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu mới"}
              </button>
            </form>
          </div>

          {/* Passkeys & Recent Activity */}
          <div className="space-y-4">
            <div className="nex-card p-5 space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-800">Khóa bảo mật WebAuthn / Passkeys</h3>
              </div>
              <p className="text-xs text-slate-500">
                Hỗ trợ Touch ID, Face ID hoặc USB YubiKey cho việc xác thực đăng nhập không mật khẩu.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span>Thiết bị đang hoạt động:</span>
                <span className="font-bold text-slate-700">Trình duyệt hiện tại</span>
              </div>
            </div>

            <div className="nex-card p-5 space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Nhật ký hoạt động gần đây</h3>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {recentActivity.map((log) => (
                  <div key={log.id} className="py-2 flex justify-between">
                    <span className="font-medium text-slate-700">{log.action}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
