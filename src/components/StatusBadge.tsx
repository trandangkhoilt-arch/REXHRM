import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "employment" | "attendance" | "request" | "risk" | "contract" | "general";
  className?: string;
}

export function StatusBadge({ status, type = "general", className = "" }: StatusBadgeProps) {
  let label = status;
  let colorStyle = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    // Employment & User Statuses
    case "ACTIVE":
      label = "Đang làm việc";
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "PROBATION":
      label = "Thử việc";
      colorStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "ON_LEAVE":
      label = "Nghỉ phép";
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "RESIGNED":
      label = "Đã thôi việc";
      colorStyle = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    case "SUSPENDED":
      label = "Đã khóa";
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;

    // Attendance Statuses
    case "COMPLETED":
      label = "Đủ công";
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "IN_PROGRESS":
      label = "Đang trong ca";
      colorStyle = "bg-sky-50 text-sky-700 border-sky-200";
      break;
    case "INCOMPLETE":
      label = "Thiếu Check-out";
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "ABSENT":
      label = "Vắng mặt";
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "ABNORMAL":
      label = "Bất thường";
      colorStyle = "bg-red-50 text-red-700 border-red-200";
      break;

    // Request Statuses
    case "PENDING":
      label = "Chờ duyệt";
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "APPROVED":
      label = "Đã duyệt";
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "REJECTED":
      label = "Từ chối";
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "DRAFT":
      label = "Bản nháp";
      colorStyle = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    case "LOCKED":
      label = "Đã khóa";
      colorStyle = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case "CONFIRMED":
      label = "Đã xác nhận";
      colorStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;

    // Risk Severities
    case "LOW":
      label = "Rủi ro thấp";
      colorStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "MEDIUM":
      label = "Trung bình";
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "HIGH":
      label = "Nghiêm trọng";
      colorStyle = "bg-orange-50 text-orange-700 border-orange-200";
      break;
    case "CRITICAL":
      label = "Nguy cấp";
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "OPEN":
      label = "Chờ xử lý";
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "INVESTIGATING":
      label = "Đang đối soát";
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "RESOLVED":
      label = "Đã giải quyết";
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "DISMISSED":
      label = "Đã bỏ qua";
      colorStyle = "bg-slate-100 text-slate-600 border-slate-200";
      break;

    // Contract Types
    case "OFFICIAL":
      label = "Chính thức";
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "INTERN":
      label = "Thực tập";
      colorStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
      break;
    case "PARTTIME":
      label = "Bán thời gian";
      colorStyle = "bg-slate-100 text-slate-700 border-slate-200";
      break;

    // Roles
    case "SUPER_ADMIN":
      label = "Super Admin";
      colorStyle = "bg-purple-100 text-purple-800 border-purple-200";
      break;
    case "HR_ADMIN":
      label = "Quản trị HR";
      colorStyle = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "MANAGER":
      label = "Quản lý";
      colorStyle = "bg-teal-100 text-teal-800 border-teal-200";
      break;
    case "EMPLOYEE":
      label = "Nhân viên";
      colorStyle = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case "PAYROLL":
      label = "Tính lương";
      colorStyle = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case "AUDITOR":
      label = "Kiểm toán";
      colorStyle = "bg-indigo-100 text-indigo-800 border-indigo-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyle} ${className}`}
    >
      {label}
    </span>
  );
}
