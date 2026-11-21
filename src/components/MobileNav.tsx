"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Clock,
  FileText,
  User,
  Grid,
  X,
  Users,
  Building2,
  FileSpreadsheet,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Settings,
  QrCode,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Lịch", href: "/schedules", icon: Calendar },
    { label: "Công", href: "/attendance", icon: Clock, isFeatured: true },
    { label: "Đơn từ", href: "/requests", icon: FileText },
    { label: "Tôi", href: "/profile", icon: User },
  ];

  const adminTabs = [
    { label: "Trạm Kiosk QR", href: "/kiosk", icon: QrCode },
    { label: "Nhân viên", href: "/employees", icon: Users },
    { label: "Phòng ban", href: "/departments", icon: Building2 },
    { label: "Bảng công", href: "/timesheets", icon: FileSpreadsheet },
    { label: "Bảng lương", href: "/payroll", icon: DollarSign },
    { label: "Cảnh báo gian lận", href: "/fraud-detection", icon: ShieldAlert },
    { label: "Báo cáo", href: "/reports", icon: BarChart3 },
    { label: "Cài đặt", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* More / Admin Sheet Overlay */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">Chức năng mở rộng & Quản trị</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-4">
              {adminTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors text-center"
                  >
                    <Icon className="w-6 h-6 mb-1.5 text-blue-600" />
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom 5-Item Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-2 flex items-center justify-around z-40 shadow-lg">
        {mainTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          if (tab.isFeatured) {
            return (
              <a
                key={tab.href}
                href={tab.href}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/40 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 mt-0.5">{tab.label}</span>
              </a>
            );
          }

          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
                isActive ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </a>
          );
        })}

        {/* Extra toggle button */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center justify-center w-14 py-1 text-slate-400 hover:text-slate-600"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Thêm</span>
        </button>
      </nav>
    </>
  );
}
