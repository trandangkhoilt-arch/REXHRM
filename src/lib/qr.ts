import crypto from "crypto";

const QR_SYSTEM_SECRET = process.env.QR_SECRET_KEY || "nexhrm-station-dynamic-qr-hmac-secret-salt-2026";

export interface DynamicQRData {
  stationCode: string;
  token: string;
  timestamp: number;
  expiresInSeconds: number;
}

/**
 * Computes the HMAC for a given station and time slice.
 */
function computeStationHMAC(stationCode: string, stationSeed: string, timeWindow: number): string {
  const message = `${stationCode}:${stationSeed}:${timeWindow}:${QR_SYSTEM_SECRET}`;
  return crypto.createHmac("sha256", QR_SYSTEM_SECRET).update(message).digest("hex").slice(0, 16);
}

/**
 * Generates dynamic QR token payload for a station kiosk.
 * Refreshes every 30 seconds.
 */
export function generateDynamicQRToken(
  stationCode: string,
  stationSeed: string,
  intervalSeconds = 30
): DynamicQRData {
  const now = Date.now();
  const timeWindow = Math.floor(now / (intervalSeconds * 1000));
  const token = computeStationHMAC(stationCode, stationSeed, timeWindow);
  const remainingMs = (timeWindow + 1) * intervalSeconds * 1000 - now;

  return {
    stationCode,
    token,
    timestamp: now,
    expiresInSeconds: Math.max(1, Math.floor(remainingMs / 1000)),
  };
}

/**
 * Validates a scanned QR token string submitted by employee mobile client.
 * Verifies against current and immediately preceding time-window (to allow transmission delay).
 */
export function validateDynamicQRToken(
  stationCode: string,
  stationSeed: string,
  submittedToken: string,
  intervalSeconds = 30
): { isValid: boolean; reason: string } {
  if (!submittedToken || !stationCode) {
    return { isValid: false, reason: "Mã QR rỗng hoặc thiếu thông tin trạm." };
  }

  const now = Date.now();
  const currentTimeWindow = Math.floor(now / (intervalSeconds * 1000));

  // Check current window, previous window (-1), and next window (+1 for slight client-server clock drift)
  for (let offset of [0, -1, 1]) {
    const validToken = computeStationHMAC(stationCode, stationSeed, currentTimeWindow + offset);
    if (crypto.timingSafeEqual(Buffer.from(validToken), Buffer.from(submittedToken))) {
      return { isValid: true, reason: "Mã QR hợp lệ và còn hiệu lực." };
    }
  }

  return {
    isValid: false,
    reason: "Mã QR đã hết hạn hoặc không khớp với trạm chấm công hiện tại. Vui lòng quét lại mã mới trên màn hình trạm.",
  };
}
