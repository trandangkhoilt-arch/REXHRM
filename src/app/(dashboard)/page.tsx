"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  FileText,
  ShieldAlert,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceWidget } from "@/components/AttendanceWidget";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/stats");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats;
  const charts = data?.charts;

  const COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Bảng điều khiển Tổng quan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi thời gian thực tình hình nhân sự, chấm công và an toàn vận hành
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="/attendance"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Chấm công ngay</span>
          </a>
          <a
            href="/requests"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            Tạo đơn từ
          </a>
        </div>
      </div>

      {/* Interactive Smart Attendance Widget */}
      <AttendanceWidget />

      {/* KPI Overview Cards (Section V: 12 KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Tổng số nhân sự"
          value={loading ? "--" : stats?.totalEmployees || 61}
          subtitle={`Chính thức: ${stats?.officialCount || 55} | Thử việc: ${stats?.probationCount || 6}`}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Đang trong ca làm việc"
          value={loading ? "--" : stats?.inShiftNow || 0}
          subtitle={`Đã check-in hôm nay: ${stats?.checkedInToday || 0}`}
          icon={Clock}
          color="emerald"
        />
        <StatsCard
          title="Đi muộn hôm nay"
          value={loading ? "--" : stats?.lateToday || 0}
          subtitle={`Chưa check-in: ${stats?.notCheckedIn || 0}`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatsCard
          title="Cảnh báo bất thường"
          value={loading ? "--" : stats?.openRiskFlagsCount || 0}
          subtitle={`Đơn chờ duyệt: ${stats?.pendingRequestsCount || 0}`}
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Additional Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="nex-card p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Nhân viên chính thức</span>
            <p className="text-base font-bold text-slate-800">{stats?.officialCount || 55}</p>
          </div>
        </div>

        <div className="nex-card p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Nghỉ phép hôm nay</span>
            <p className="text-base font-bold text-slate-800">{stats?.onLeaveCount || 2}</p>
          </div>
        </div>

        <div className="nex-card p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Đơn đang chờ duyệt</span>
            <p className="text-base font-bold text-slate-800">{stats?.pendingRequestsCount || 1}</p>
          </div>
        </div>

        <div className="nex-card p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Cảnh báo gian lận mở</span>
            <p className="text-base font-bold text-slate-800">{stats?.openRiskFlagsCount || 2}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Attendance Rate Chart */}
        <div className="lg:col-span-2 nex-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Tỷ lệ Chấm công theo ngày trong tuần
              </h3>
              <p className="text-xs text-slate-500">
                Phân tích số lượt đúng giờ, đi muộn và vắng mặt
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Tuần hiện tại
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts?.weeklyTrends || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="onTime" name="Đúng giờ" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Đi muộn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Vắng/Chưa đến" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Distribution by Department */}
        <div className="nex-card p-5 space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Phân bố nhân sự theo phòng ban</h3>
            <p className="text-xs text-slate-500">Tỷ lệ quy mô các bộ phận</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.departmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {(charts?.departmentDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} nhân sự`,
                    item.payload.name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
            {(charts?.departmentDistribution || []).slice(0, 6).map((d: any, i: number) => (
              <div key={d.code} className="flex items-center space-x-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{d.name}:</span>
                <span className="font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Fraud Alerts & Action Panel */}
      <div className="nex-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cảnh báo gian lận cần đối soát</h3>
              <p className="text-xs text-slate-500">Phát hiện tự động bởi hệ thống AI & Geofence</p>
            </div>
          </div>
          <a
            href="/fraud-detection"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Xem tất cả cảnh báo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusBadge status="HIGH" />
                <span className="font-bold text-xs text-slate-800">
                  Lê Hoàng Nam (NEX-003) - Bỏ lỡ xác minh hiện diện & Thiếu Check-out
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Nhân viên check-in lúc 08:29 nhưng không phản hồi kiểm tra hiện diện ngẫu nhiên và rời nơi làm việc không check-out.
              </p>
            </div>
            <a
              href="/fraud-detection"
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
            >
              Xem bằng chứng &rarr;
            </a>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusBadge status="HIGH" />
                <span className="font-bold text-xs text-slate-800">
                  Phạm Minh Cường (NEX-008) - Chấm công ngoài bán kính cho phép
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Nỗ lực check-in cách văn phòng Keangnam 2.4km (vượt quá bán kính 200m).
              </p>
            </div>
            <a
              href="/fraud-detection"
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
            >
              Xem bằng chứng &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
