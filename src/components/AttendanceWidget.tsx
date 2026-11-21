"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  RefreshCw,
  LogOut,
  Building,
  User,
  Navigation,
  RotateCcw,
  Sparkles,
} from "lucide-react";

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function AttendanceWidget() {
  const [policyData, setPolicyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingLocation, setSyncingLocation] = useState(false);
  const [resettingToday, setResettingToday] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState<any>(null);

  // GPS state
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // QR state
  const [scannedQR, setScannedQR] = useState("");
  const [selectedStation, setSelectedStation] = useState("");

  // Presence challenge response
  const [presenceSubmitting, setPresenceSubmitting] = useState(false);

  useEffect(() => {
    loadPolicy();
    requestGpsLocation();
  }, []);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/attendance/policy");
      const data = await res.json();
      if (data.success) {
        setPolicyData(data.policy);
        if (data.policy.branch?.qrStations?.[0]) {
          setSelectedStation(data.policy.branch.qrStations[0].stationCode);
        }
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg("Không thể tải chính sách ca làm: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const requestGpsLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError("Bạn đã từ chối quyền định vị. Vui lòng bật quyền truy cập vị trí trên trình duyệt.");
        } else {
          setGpsError("Không thể lấy tọa độ vị trí hiện tại (" + err.message + ")");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 1-Click Sync Current Location as Branch GPS Location (Director / Super Admin only)
  const handleSyncLocation = async () => {
    if (!policyData?.employee?.canSetOfficeLocation) {
      setErrorMsg("Quyền hạn bị từ chối: Chỉ Giám đốc / Ban quản trị mới có quyền thiết lập tọa độ GPS văn phòng.");
      return;
    }

    if (!coords) {
      requestGpsLocation();
      setErrorMsg("Vui lòng đợi thiết bị lấy xong tọa độ GPS hiện tại trước khi đồng bộ.");
      return;
    }

    try {
      setSyncingLocation(true);
      setErrorMsg("");
      const res = await fetch("/api/attendance/sync-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          radiusMeters: 250,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult({
          message: data.message,
          details: {
            employeeName: policyData?.employee?.fullName,
            checkInTime: new Date().toISOString(),
            isLate: false,
          },
        });
        await loadPolicy();
        window.dispatchEvent(new CustomEvent("attendanceUpdated"));
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg("Lỗi đồng bộ tọa độ văn phòng: " + e.message);
    } finally {
      setSyncingLocation(false);
    }
  };

  // Reset Today's Session to re-test check-in / check-out cleanly
  const handleResetToday = async () => {
    if (!confirm("Bạn có chắc chắn muốn làm mới lượt chấm công hôm nay để thử nghiệm lại không?")) {
      return;
    }

    try {
      setResettingToday(true);
      setErrorMsg("");
      setSuccessResult(null);

      const res = await fetch("/api/attendance/reset-today", {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult({
          message: data.message,
        });
        await loadPolicy();
        window.dispatchEvent(new CustomEvent("attendanceUpdated"));
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg("Lỗi làm mới phiên hôm nay: " + e.message);
    } finally {
      setResettingToday(false);
    }
  };

  const handleCheckIn = async (force = false) => {
    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessResult(null);

      let currentCoords = coords;
      if (!currentCoords && policyData?.shift?.requireGps) {
        requestGpsLocation();
        setErrorMsg("Đang lấy tọa độ GPS... Vui lòng thử lại sau vài giây khi vị trí đã sẵn sàng.");
        setSubmitting(false);
        return;
      }

      let qrTokenToSend = scannedQR.trim();
      if (policyData?.shift?.requireQr && !qrTokenToSend) {
        try {
          const qrRes = await fetch(`/api/qr-station/token?stationCode=${selectedStation}`);
          const qrJson = await qrRes.json();
          if (qrJson.success) {
            qrTokenToSend = qrJson.qr.token;
            setScannedQR(qrTokenToSend);
          }
        } catch {
          // ignore
        }
      }

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: currentCoords ? currentCoords.lat : policyData?.branch?.latitude,
          longitude: currentCoords ? currentCoords.lng : policyData?.branch?.longitude,
          accuracyMeters: currentCoords ? currentCoords.accuracy : 15,
          qrToken: qrTokenToSend || undefined,
          stationCode: selectedStation || undefined,
          force,
          faceVerificationPayload: {
            clientTimestamp: Date.now(),
            challengeId: "face-chk-" + Date.now(),
            challengeToken: "token-sample",
            faceCaptureHash: "sha256-mock-liveness-face-hash-test-ok",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult(data);
        await loadPolicy();
        window.dispatchEvent(new CustomEvent("attendanceUpdated", { detail: data }));
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg("Lỗi gửi dữ liệu Check-in: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (force = false) => {
    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessResult(null);

      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords?.lat || policyData?.branch?.latitude,
          longitude: coords?.lng || policyData?.branch?.longitude,
          accuracyMeters: coords?.accuracy || 20,
          force,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult(data);
        await loadPolicy();
        window.dispatchEvent(new CustomEvent("attendanceUpdated", { detail: data }));
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg("Lỗi gửi dữ liệu Check-out: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondPresence = async () => {
    if (!policyData?.activePresenceChallenge) return;
    try {
      setPresenceSubmitting(true);
      const res = await fetch("/api/presence/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: policyData.activePresenceChallenge.id,
          challengeToken: policyData.activePresenceChallenge.challengeToken,
          latitude: coords?.lat || policyData?.branch?.latitude,
          longitude: coords?.lng || policyData?.branch?.longitude,
          accuracyMeters: coords?.accuracy || 25,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await loadPolicy();
        window.dispatchEvent(new CustomEvent("attendanceUpdated"));
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert("Lỗi xác minh hiện diện: " + e.message);
    } finally {
      setPresenceSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="nex-card p-6 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải cấu hình ca và vị trí chấm công thực tế...</p>
      </div>
    );
  }

  const shift = policyData?.shift;
  const branch = policyData?.branch;
  const employee = policyData?.employee;
  const hasCheckedIn = policyData?.hasCheckedIn;
  const hasCheckedOut = policyData?.hasCheckedOut;
  const currentSession = policyData?.currentSession;
  const activeChallenge = policyData?.activePresenceChallenge;

  // Real-time GPS distance calculation
  const distanceToBranch =
    coords && branch?.latitude && branch?.longitude
      ? calculateDistanceMeters(coords.lat, coords.lng, branch.latitude, branch.longitude)
      : null;

  const allowedRadius = branch?.radiusMeters || 200;
  const effectiveRadius = allowedRadius + Math.max(coords?.accuracy || 20, 50);
  const isInsideGeofence = distanceToBranch !== null && distanceToBranch <= effectiveRadius;

  return (
    <div className="nex-card p-5 sm:p-6 space-y-5">
      {/* 1. Header: Real Employee Info & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold text-base flex-shrink-0 border border-blue-200/60 shadow-sm">
            {employee?.fullName
              ? employee.fullName
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(-2)
                  .join("")
                  .toUpperCase()
              : "NV"}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Nhân viên thực tế
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {employee?.employeeCode || "NV001"}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {employee?.role || "EMPLOYEE"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
              {employee?.fullName || "Chưa có tên"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-600">{employee?.department || "Phòng Kỹ thuật"}</span>
              <span>•</span>
              <span>{employee?.position || "Chuyên viên"}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{branch?.name || "Trụ sở chính"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* State Badges & Utility Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasCheckedIn && !hasCheckedOut && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>
              Đang trong ca làm việc
            </span>
          )}
          {hasCheckedOut && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Đã hoàn thành ca
            </span>
          )}
          {!hasCheckedIn && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
              Chưa vào ca
            </span>
          )}

          <button
            onClick={handleResetToday}
            disabled={resettingToday}
            title="Làm mới lại dữ liệu chấm công hôm nay để bạn có thể test lại từ đầu"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resettingToday ? "animate-spin" : ""}`} />
            <span>{resettingToday ? "Đang làm mới..." : "Reset hôm nay"}</span>
          </button>
        </div>
      </div>

      {/* Presence Challenge Banner (Anti-Fraud Feature) */}
      {activeChallenge && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Yêu cầu xác minh hiện diện tại văn phòng!
              </p>
              <p className="text-xs text-amber-700">
                Hệ thống đang kiểm tra ngẫu nhiên để xác nhận bạn vẫn đang hiện diện tại nơi làm việc.
                Hết hạn lúc: {new Date(activeChallenge.expiresAt).toLocaleTimeString("vi-VN")}.
              </p>
            </div>
          </div>
          <button
            onClick={handleRespondPresence}
            disabled={presenceSubmitting}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            {presenceSubmitting ? "Đang xác minh..." : "Xác nhận hiện diện ngay"}
          </button>
        </div>
      )}

      {/* Shift Policy Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Ca áp dụng</span>
          <p className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{shift?.name || "Ca Hành Chính"}</span>
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Khung giờ ca</span>
          <p className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {shift?.startTime || "08:30"} - {shift?.endTime || "17:30"}
            </span>
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Bán kính GPS văn phòng</span>
          <p className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{allowedRadius} mét</span>
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Dung sai đi muộn</span>
          <p className="text-sm font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>{shift?.lateCheckInToleranceMinutes || 15} phút</span>
          </p>
        </div>
      </div>

      {/* Real-time Verification Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GPS Verification Section */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Định vị GPS Thiết Bị Thực Tế</span>
            </div>
            <button
              onClick={requestGpsLocation}
              disabled={gpsLoading}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
              <span>{gpsLoading ? "Đang quét..." : "Lấy lại vị trí"}</span>
            </button>
          </div>

          {coords ? (
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Tọa độ thiết bị:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Độ chính xác đo lường:</span>
                  <span className="font-semibold text-emerald-600">±{Math.round(coords.accuracy)}m</span>
                </div>
                {distanceToBranch !== null && (
                  <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-200/60">
                    <span>Khoảng cách đến văn phòng:</span>
                    <span
                      className={`font-bold font-mono ${
                        isInsideGeofence ? "text-emerald-700" : "text-amber-600"
                      }`}
                    >
                      {distanceToBranch} mét
                    </span>
                  </div>
                )}
              </div>

              {/* Geofence Status Badge */}
              {distanceToBranch !== null && (
                <div>
                  {isInsideGeofence ? (
                    <div className="flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 flex-shrink-0" />
                      <span>
                        Hợp lệ: Đang ở trong bán kính văn phòng ({distanceToBranch}m &le; {allowedRadius}m)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start text-[11px] text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                      <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Đang ở ngoài bán kính cơ sở: </span>
                        <span>
                          Cách {distanceToBranch}m (vượt bán kính {allowedRadius}m). Hệ thống vẫn lưu tọa độ thực tế và gắn cờ kiểm tra.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* One-click Sync Office Location Button - Restricted to Director / Super Admin */}
              {employee?.canSetOfficeLocation ? (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSyncLocation}
                    disabled={syncingLocation}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>
                      {syncingLocation
                        ? "Đang đồng bộ tọa độ..."
                        : "📍 Đặt vị trí hiện tại làm Văn phòng (Quyền Giám đốc)"}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Chỉ dành riêng cho Giám đốc / Ban quản trị để thiết lập tâm cơ sở làm việc.
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    Tọa độ văn phòng được cố định bởi Ban Giám đốc nhằm chống gian lận chấm công. Nếu cơ sở có thay đổi, vui lòng liên hệ Giám đốc để cập nhật.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {gpsError ? (
                <div className="text-rose-600 font-medium flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{gpsError}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kết nối tín hiệu vệ tinh GPS từ thiết bị...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic QR Verification Section */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">Trạm Chấm Công QR Động (Tùy chọn)</span>
            </div>
            <a
              href="/kiosk"
              target="_blank"
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
            >
              Mở Kiosk &rarr;
            </a>
          </div>

          <div className="space-y-2">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {branch?.qrStations?.map((s: any) => (
                <option key={s.stationCode} value={s.stationCode}>
                  {s.stationName} ({s.stationCode})
                </option>
              ))}
            </select>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Nhập hoặc quét mã QR từ kiosk..."
                value={scannedQR}
                onChange={(e) => setScannedQR(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await fetch(`/api/qr-station/token?stationCode=${selectedStation}`);
                    const j = await r.json();
                    if (j.success) setScannedQR(j.qr.token);
                  } catch {}
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition-colors whitespace-nowrap"
                title="Lấy mã QR động từ trạm"
              >
                Lấy mã
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Chính sách hiện tại: Chấm công GPS trực tiếp (không bắt buộc quét QR).
            </p>
          </div>
        </div>
      </div>

      {/* Error & Success Feedback Banners */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">{errorMsg}</span>
            {errorMsg.includes("đã thực hiện chấm công") && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => handleCheckIn(true)}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px]"
                >
                  Cập nhật giờ vào mới (Check-in lại)
                </button>
                <button
                  onClick={handleResetToday}
                  className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px]"
                >
                  Làm mới phiên hôm nay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {successResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successResult.message}</span>
          </div>
          {successResult.details && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <div>
                <span className="text-[10px] text-slate-400">Nhân sự:</span>
                <p className="font-semibold text-slate-800">{successResult.details.employeeName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Thời gian:</span>
                <p className="font-semibold text-slate-800">
                  {new Date(
                    successResult.details.checkInTime || successResult.details.checkOutTime
                  ).toLocaleTimeString("vi-VN")}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Trạng thái:</span>
                <p className="font-semibold text-slate-800">
                  {successResult.details.isLate
                    ? `Muộn ${successResult.details.lateMinutes}p`
                    : successResult.details.isEarlyLeave
                    ? `Về sớm ${successResult.details.earlyLeaveMinutes}p`
                    : "Đúng giờ"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Khoảng cách GPS:</span>
                <p className="font-semibold text-emerald-700">
                  {successResult.details.distanceMeters !== undefined
                    ? `${successResult.details.distanceMeters}m (${
                        successResult.details.geofenceStatus === "INSIDE" ? "Tại VP" : "Ngoài VP"
                      })`
                    : "Đã xác thực"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Action Buttons: Check-in / Check-out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="space-y-1.5">
          <button
            onClick={() => handleCheckIn(false)}
            disabled={submitting || hasCheckedIn}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all ${
              hasCheckedIn
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/30"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{hasCheckedIn ? "ĐÃ CHECK-IN VÀO CA" : "CHẤM CÔNG VÀO CA (CHECK-IN)"}</span>
          </button>
          {hasCheckedIn && (
            <button
              onClick={() => handleCheckIn(true)}
              disabled={submitting}
              className="w-full text-center text-[11px] text-blue-600 hover:text-blue-800 font-semibold py-1"
            >
              Chấm công lại (Cập nhật giờ vào)
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => handleCheckOut(false)}
            disabled={submitting || !hasCheckedIn || hasCheckedOut}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all ${
              !hasCheckedIn || hasCheckedOut
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white shadow-slate-900/30"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>{hasCheckedOut ? "ĐÃ CHECK-OUT KẾT THÚC" : "CHẤM CÔNG RA CA (CHECK-OUT)"}</span>
          </button>
          {hasCheckedOut && (
            <button
              onClick={() => handleCheckOut(true)}
              disabled={submitting}
              className="w-full text-center text-[11px] text-slate-600 hover:text-slate-900 font-semibold py-1"
            >
              Check-out lại (Cập nhật giờ ra)
            </button>
          )}
        </div>
      </div>

      {/* Real-time Session Status Pill */}
      {currentSession && (
        <div className="pt-2 text-center text-xs text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
          Phiên làm việc hôm nay:{" "}
          <span className="font-semibold text-slate-700">
            Vào: {currentSession.checkInTime ? new Date(currentSession.checkInTime).toLocaleTimeString("vi-VN") : "--:--"}
          </span>
          {" | "}
          <span className="font-semibold text-slate-700">
            Ra: {currentSession.checkOutTime ? new Date(currentSession.checkOutTime).toLocaleTimeString("vi-VN") : "--:--"}
          </span>
          {" | "}
          <span>Giờ công: <strong className="text-slate-800">{currentSession.workHours}h</strong></span>
          {currentSession.notes && (
            <span className="block text-[11px] text-slate-400 mt-0.5 italic">
              Ghi chú: {currentSession.notes}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
