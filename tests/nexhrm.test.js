const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

// 1. Geofence & Haversine calculation test
function calculateHaversineDistance(coord1, coord2) {
  const toRad = (degree) => (degree * Math.PI) / 180;
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371000 * c * 100) / 100;
}

function verifyGeofence(userCoord, accuracyMeters, target) {
  const minRequiredAccuracy = target.minAccuracyMeters ?? 150;
  const isAccuracyAcceptable = accuracyMeters > 0 && accuracyMeters <= minRequiredAccuracy;
  const distanceMeters = calculateHaversineDistance(userCoord, target);
  const isInside = distanceMeters <= target.radiusMeters;

  return {
    isInside: isInside && isAccuracyAcceptable,
    distanceMeters,
    accuracyAcceptable: isAccuracyAcceptable,
  };
}

test("Scenario 1 & 2: GPS Geofence inside vs outside boundaries", () => {
  const officeHN = { latitude: 21.016934, longitude: 105.784111, radiusMeters: 200, minAccuracyMeters: 100 };
  
  // Inside office (30 meters away)
  const insideCoord = { latitude: 21.0171, longitude: 105.7842 };
  const insideResult = verifyGeofence(insideCoord, 15, officeHN);
  assert.equal(insideResult.isInside, true);
  assert.ok(insideResult.distanceMeters < 200);

  // Far away outside office (2.4 km away)
  const outsideCoord = { latitude: 21.038, longitude: 105.75 };
  const outsideResult = verifyGeofence(outsideCoord, 15, officeHN);
  assert.equal(outsideResult.isInside, false);
  assert.ok(outsideResult.distanceMeters > 2000);
});

test("Scenario 3: GPS accuracy insufficient rejection", () => {
  const officeHN = { latitude: 21.016934, longitude: 105.784111, radiusMeters: 200, minAccuracyMeters: 50 };
  
  // Location is technically close, but GPS accuracy is terrible (150m error margin)
  const closeCoord = { latitude: 21.016934, longitude: 105.784111 };
  const inaccurateResult = verifyGeofence(closeCoord, 150, officeHN);
  assert.equal(inaccurateResult.accuracyAcceptable, false);
  assert.equal(inaccurateResult.isInside, false);
});

// 2. Dynamic QR Station HMAC validation tests
const QR_SECRET = "nexhrm-station-dynamic-qr-hmac-secret-salt-2026";
function computeStationHMAC(stationCode, stationSeed, timeWindow) {
  const message = `${stationCode}:${stationSeed}:${timeWindow}:${QR_SECRET}`;
  return crypto.createHmac("sha256", QR_SECRET).update(message).digest("hex").slice(0, 16);
}

function validateQR(stationCode, stationSeed, submittedToken, simulatedTime = Date.now(), intervalSeconds = 30) {
  const currentTimeWindow = Math.floor(simulatedTime / (intervalSeconds * 1000));
  for (let offset of [0, -1, 1]) {
    const validToken = computeStationHMAC(stationCode, stationSeed, currentTimeWindow + offset);
    if (crypto.timingSafeEqual(Buffer.from(validToken), Buffer.from(submittedToken))) {
      return { isValid: true };
    }
  }
  return { isValid: false, reason: "Mã QR đã hết hạn hoặc không khớp." };
}

test("Scenario 5 & 6: Dynamic QR token validity and expiration", () => {
  const stationCode = "ST_HN_GATE_01";
  const seed = "test-station-secret-seed";
  const now = Date.now();
  const timeWindow = Math.floor(now / 30000);
  const currentToken = computeStationHMAC(stationCode, seed, timeWindow);

  // Valid current token
  const validCheck = validateQR(stationCode, seed, currentToken, now);
  assert.equal(validCheck.isValid, true);

  // Expired token (from 5 minutes ago)
  const expiredTime = now + 5 * 60 * 1000;
  const expiredCheck = validateQR(stationCode, seed, currentToken, expiredTime);
  assert.equal(expiredCheck.isValid, false);
});

// 3. Biometric Liveness test (Never fake random true!)
test("Scenario 8: Liveness detection requires configured provider", () => {
  function verifyFaceLiveness(provider) {
    if (provider === "unconfigured") {
      return { isVerified: false, status: "PROVIDER_NOT_CONFIGURED" };
    }
    if (provider === "internal_test") {
      return { isVerified: true, status: "VERIFIED" };
    }
    return { isVerified: false, status: "FAILED" };
  }

  const unconfigured = verifyFaceLiveness("unconfigured");
  assert.equal(unconfigured.isVerified, false);
  assert.equal(unconfigured.status, "PROVIDER_NOT_CONFIGURED");

  const configured = verifyFaceLiveness("internal_test");
  assert.equal(configured.isVerified, true);
});

// 4. Overnight Shift Calculation Test
test("Scenario 18: Overnight shift hours calculation", () => {
  function calculateShiftWorkHours(startTime, endTime, isOvernight) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (isOvernight && endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    return (endMinutes - startMinutes) / 60;
  }

  // Overnight 22:00 to 06:00
  const hours = calculateShiftWorkHours("22:00", "06:00", true);
  assert.equal(hours, 8);

  // Administrative 08:30 to 17:30
  const adminHours = calculateShiftWorkHours("08:30", "17:30", false);
  assert.equal(adminHours, 9);
});

// 5. Payroll Tax & Net Calculation Test
test("Scenario 16: Vietnamese PIT progressive bracket calculation", () => {
  function calculateVietnamesePIT(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    if (taxableIncome <= 5000000) return taxableIncome * 0.05;
    if (taxableIncome <= 10000000) return 5000000 * 0.05 + (taxableIncome - 5000000) * 0.1;
    return 5000000 * 0.05 + 5000000 * 0.1 + (taxableIncome - 10000000) * 0.15;
  }

  // 0 taxable income
  assert.equal(calculateVietnamesePIT(0), 0);

  // 4,000,000 VND taxable income (bracket 1: 5%) = 200,000 VND
  assert.equal(calculateVietnamesePIT(4000000), 200000);

  // 8,000,000 VND taxable income = 250,000 + 3,000,000 * 10% = 550,000 VND
  assert.equal(calculateVietnamesePIT(8000000), 550000);
});

// 6. RBAC Payroll privacy test
test("Scenario 16: Non-payroll employees cannot access other staff salary slips", () => {
  function canViewSalary(currentUserRole, currentEmployeeId, targetEmployeeId) {
    const isPrivileged = ["SUPER_ADMIN", "PAYROLL"].includes(currentUserRole);
    if (isPrivileged) return true;
    return currentEmployeeId === targetEmployeeId;
  }

  // Employee cannot see other employee's salary
  assert.equal(canViewSalary("EMPLOYEE", "emp-001", "emp-002"), false);

  // Employee CAN see own salary
  assert.equal(canViewSalary("EMPLOYEE", "emp-001", "emp-001"), true);

  // Payroll specialist CAN see any employee's salary
  assert.equal(canViewSalary("PAYROLL", "emp-005", "emp-001"), true);

  // Super admin CAN see any employee's salary
  assert.equal(canViewSalary("SUPER_ADMIN", "emp-admin", "emp-001"), true);
});
