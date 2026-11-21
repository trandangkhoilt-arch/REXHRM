/**
 * Biometric & Liveness Verification Subsystem.
 * Enforces explicit verification provider configuration.
 * Does NOT permit fake random verifications.
 */

export interface LivenessVerificationRequest {
  challengeId: string;
  challengeToken: string;
  faceCaptureHash?: string;
  gesturesCompleted?: string[];
  clientTimestamp: number;
}

export interface LivenessVerificationResponse {
  isVerified: boolean;
  status: "VERIFIED" | "PROVIDER_NOT_CONFIGURED" | "CHALLENGE_EXPIRED" | "FAILED_LIVENESS" | "ALTERNATIVE_REQUIRED";
  confidenceScore: number;
  message: string;
}

export async function verifyFaceLiveness(
  request: LivenessVerificationRequest,
  policyRequireFace = false
): Promise<LivenessVerificationResponse> {
  const provider = process.env.LIVENESS_PROVIDER || "unconfigured";

  if (!policyRequireFace) {
    return {
      isVerified: true,
      status: "VERIFIED",
      confidenceScore: 1.0,
      message: "Chính sách ca làm việc không bắt buộc nhận diện khuôn mặt.",
    };
  }

  // Strict check: If unconfigured, explicitly report not configured and do NOT pass.
  if (provider === "unconfigured") {
    return {
      isVerified: false,
      status: "PROVIDER_NOT_CONFIGURED",
      confidenceScore: 0.0,
      message:
        "Dịch vụ nhận diện khuôn mặt sống (Liveness Provider) chưa được thiết lập trong hệ thống. Vui lòng liên hệ Quản trị viên HR để kích hoạt hoặc sử dụng phương thức xác minh thay thế (GPS + Trạm QR hoặc Duyệt thủ công).",
    };
  }

  // Internal test verification provider (requires valid non-expired challenge session & non-empty capture hash)
  if (provider === "internal_test") {
    const elapsed = Date.now() - request.clientTimestamp;
    if (elapsed > 120000) {
      return {
        isVerified: false,
        status: "CHALLENGE_EXPIRED",
        confidenceScore: 0.0,
        message: "Phiên xác thực khuôn mặt đã hết hạn (quá 2 phút). Vui lòng chụp lại.",
      };
    }

    if (!request.faceCaptureHash || request.faceCaptureHash.length < 16) {
      return {
        isVerified: false,
        status: "FAILED_LIVENESS",
        confidenceScore: 0.0,
        message: "Không phát hiện khuôn mặt hợp lệ trong khung hình hoặc dữ liệu hình ảnh bị mờ.",
      };
    }

    return {
      isVerified: true,
      status: "VERIFIED",
      confidenceScore: 0.98,
      message: "Xác thực khuôn mặt sống đạt tiêu chuẩn kiểm thử nội bộ.",
    };
  }

  // External provider integration point (AWS Rekognition Face Liveness / Azure AI Face API)
  return {
    isVerified: false,
    status: "PROVIDER_NOT_CONFIGURED",
    confidenceScore: 0.0,
    message: "Nhà cung cấp sinh trắc học ngoài chưa được kích hoạt khóa API.",
  };
}
