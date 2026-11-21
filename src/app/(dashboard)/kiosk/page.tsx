"use client";

import React, { useState, useEffect } from "react";
import { QrCode, RefreshCw, ShieldCheck, Clock, Building, AlertCircle } from "lucide-react";
import QRCode from "qrcode";

export default function KioskPage() {
  const [stationCode, setStationCode] = useState("ST_HN_GATE_01");
  const [kioskData, setKioskData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(30);
  const [loading, setLoading] = useState(true);
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

    // Initial load
    fetchToken();

    // Auto refresh timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, [stationCode]);

  const fetchToken = async () => {
    try {
      const res = await fetch(`/api/qr-station/token?stationCode=${stationCode}`);
      const json = await res.json();
      if (json.success) {
        setKioskData(json);
        setCountdown(json.qr.expiresInSeconds || 30);

        // Generate QR code SVG/DataURL
        const qrString = JSON.stringify({
          stationCode: json.station.stationCode,
          token: json.qr.token,
          timestamp: json.qr.timestamp,
        });

        const url = await QRCode.toDataURL(qrString, {
          width: 320,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrDataUrl(url);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-6 px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Trạm Chấm Công QR Động Thông Minh</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            {kioskData?.station?.stationName || "Trạm Check-in Sảnh Tầng 1"}
          </h1>
          <p className="text-xs text-blue-100 flex items-center justify-center space-x-1">
            <Building className="w-3.5 h-3.5" />
            <span>{kioskData?.station?.branchName || "Trụ sở chính Hà Nội"}</span>
            <span>&bull;</span>
            <span className="font-mono">{stationCode}</span>
          </p>
        </div>

        {/* Live Clock & QR Display Container */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-center space-x-2 text-slate-800">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-black font-mono tracking-wider">
              {currentTime || "--:--:--"}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center">
            {loading || !qrDataUrl ? (
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <img
                src={qrDataUrl}
                alt="Dynamic QR Code"
                className="w-full h-full object-contain rounded-xl"
              />
            )}
          </div>

          {/* Token String Preview & Countdown Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold px-2">
              <span className="text-slate-500">Mã xác thực thời gian thực:</span>
              <span className="font-mono text-blue-600 font-bold tracking-widest">
                {kioskData?.qr?.token || "••••••••"}
              </span>
            </div>

            {/* Countdown Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Mã tự động xoay chuyển sau:{" "}
              <span className="font-bold text-blue-600">{countdown}s</span>
            </p>
          </div>

          {/* Station Switcher for multi-gate testing */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-2">
            <span className="text-xs text-slate-400">Chọn trạm:</span>
            <select
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ST_HN_GATE_01">ST_HN_GATE_01 (Sảnh Tầng 1 HN)</option>
              <option value="ST_HN_FLOOR_18">ST_HN_FLOOR_18 (Văn phòng Tầng 18 HN)</option>
              <option value="ST_HCM_F25_01">ST_HCM_F25_01 (Bitexco Tầng 25 HCM)</option>
            </select>
          </div>

          {/* Anti-Fraud Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left flex items-start space-x-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Cơ chế chống gian lận:</strong> Mã QR được gắn chữ ký số mật mã HMAC và hết hạn mỗi 30 giây. Chụp ảnh màn hình chuyển tiếp sẽ bị hệ thống phát hiện và từ chối.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
