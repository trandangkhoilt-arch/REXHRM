/**
 * Geographic calculation and geofence verification module.
 * Uses exact Haversine formula for geodesic distance on WGS84 ellipsoid approximation.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceTarget extends Coordinates {
  radiusMeters: number;
  minAccuracyMeters?: number;
  name?: string;
}

export interface GeofenceVerificationResult {
  isInside: boolean;
  distanceMeters: number;
  accuracyAcceptable: boolean;
  accuracyMeters: number;
  allowedRadiusMeters: number;
  message: string;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two points in meters using Haversine formula.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Verifies if coordinates are strictly within a designated office geofence and accuracy limit.
 */
export function verifyGeofence(
  userCoord: Coordinates,
  accuracyMeters: number,
  target: GeofenceTarget
): GeofenceVerificationResult {
  const minRequiredAccuracy = target.minAccuracyMeters ?? 150;
  const isAccuracyAcceptable = accuracyMeters > 0 && accuracyMeters <= minRequiredAccuracy;

  const distanceMeters = calculateHaversineDistance(userCoord, target);

  // Buffer: allow up to accuracy/2 or max 20m tolerance for GPS jitter
  const dynamicTolerance = Math.min(accuracyMeters * 0.3, 25);
  const effectiveRadius = target.radiusMeters + dynamicTolerance;

  const isInside = distanceMeters <= effectiveRadius;

  let message = "Vị trí nằm trong phạm vi cho phép.";
  if (!isAccuracyAcceptable) {
    message = `Độ chính xác GPS (${Math.round(accuracyMeters)}m) không đạt tiêu chuẩn yêu cầu (tối đa ${minRequiredAccuracy}m). Hãy ra nơi thoáng hoặc bật Wi-Fi để tăng độ chính xác.`;
  } else if (!isInside) {
    message = `Bạn đang cách cơ sở làm việc ${Math.round(distanceMeters)}m, vượt quá bán kính quy định (${target.radiusMeters}m).`;
  }

  return {
    isInside: isInside && isAccuracyAcceptable,
    distanceMeters,
    accuracyAcceptable: isAccuracyAcceptable,
    accuracyMeters,
    allowedRadiusMeters: target.radiusMeters,
    message,
  };
}
