"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, Clock, CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user?: any;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    // Fetch notifications
    fetchNotifications();

    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search / Brand mobile view */}
      <div className="flex items-center space-x-3">
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
            N
          </div>
          <span className="font-extrabold text-slate-800 text-base">NexHRM</span>
        </div>

        <div className="hidden sm:flex items-center relative w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên, mã, chức vụ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Real-time server synced clock badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-100/80 rounded-full text-xs font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentTime || "--:--:--"}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-800">Thông báo ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đánh dấu đã đọc</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                        !n.isRead ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Mini info */}
        <a
          href="/profile"
          className="flex items-center space-x-2 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity"
        >
          <img
            src={user?.employee?.avatarUrl || "https://i.pravatar.cc/100?u=user"}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <span className="hidden lg:inline text-xs font-semibold text-slate-700">
            {user?.employee?.fullName || "Tài khoản"}
          </span>
        </a>
      </div>
    </header>
  );
}
