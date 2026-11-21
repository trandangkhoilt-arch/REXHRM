"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  QrCode,
  Users,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  DollarSign,
  ShieldAlert,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface SidebarProps {
  user?: any;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { label: "Tổng quan", href: "/", icon: LayoutDashboard },
    { label: "Chấm công", href: "/attendance", icon: Clock },
    { label: "Trạm Kiosk QR", href: "/kiosk", icon: QrCode },
    { label: "Nhân viên", href: "/employees", icon: Users },
    { label: "Phòng ban", href: "/departments", icon: Building2 },
    { label: "Ca & Lịch làm", href: "/schedules", icon: CalendarDays },
    { label: "Bảng công", href: "/timesheets", icon: FileSpreadsheet },
    { label: "Đơn từ & Duyệt", href: "/requests", icon: FileText },
    { label: "Bảng lương", href: "/payroll", icon: DollarSign },
    { label: "Cảnh báo gian lận", href: "/fraud-detection", icon: ShieldAlert },
    { label: "Báo cáo thống kê", href: "/reports", icon: BarChart3 },
    { label: "Hồ sơ của tôi", href: "/profile", icon: User },
    { label: "Cấu hình hệ thống", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/30">
              N
            </div>
            <div>
              <span className="font-extrabold text-slate-800 tracking-tight text-lg leading-none">
                Nex<span className="text-blue-600">HRM</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">ENTERPRISE</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            N
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                }`}
              />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img
                src={user?.employee?.avatarUrl || "https://i.pravatar.cc/100?u=user"}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.employee?.fullName || user?.email || "Người dùng"}
                </p>
                <div className="mt-0.5">
                  <StatusBadge status={user?.role || "EMPLOYEE"} />
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
