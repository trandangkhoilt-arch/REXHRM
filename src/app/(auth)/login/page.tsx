"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nexhrm.vn");
  const [password, setPassword] = useState("NexHRM@2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Đăng nhập không thành công.");
      }
    } catch (err: any) {
      setErrorMsg("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass = "NexHRM@2026") => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 mb-2">
            <span className="text-2xl font-black">N</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Nex<span className="text-blue-400">HRM</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Hệ thống Quản lý nhân sự & Chấm công thông minh đa nền tảng
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">Đăng nhập hệ thống</h2>
            <p className="text-xs text-slate-500">
              Nhập thông tin tài khoản tổ chức của bạn để tiếp tục
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email công việc
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexhrm.vn"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Tài khoản mẫu trải nghiệm (Demo Roles)
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="Super Admin (Toàn quyền)"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("hr@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="HR Admin (Nhân sự)"
              >
                💼 Quản trị HR
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("manager@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="Manager (Trưởng phòng CNTT)"
              >
                👔 Quản lý
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("employee@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="Employee (Nhân viên)"
              >
                👨‍💻 Nhân viên
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("payroll@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="Payroll (Tính lương C&B)"
              >
                💰 Tính lương
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("auditor@nexhrm.vn")}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                title="Auditor (Kiểm toán)"
              >
                🔍 Kiểm toán
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          NexHRM Enterprise Edition &copy; 2026. Bảo mật đa tầng chuẩn ISO 27001.
        </p>
      </div>
    </div>
  );
}
