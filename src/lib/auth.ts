import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { RoleType } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "nexhrm-jwt-secret-key-production-level-enterprise-encryption-2026"
);

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "nexhrm_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: RoleType;
  orgId: string;
  employeeId?: string;
  employeeCode?: string;
  fullName?: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest | Request) {
  let token: string | undefined;

  if (req && "cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    token = (req as NextRequest).cookies.get(SESSION_COOKIE)?.value;
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value;
    } catch {
      // Outside request context
    }
  }

  // Also support Authorization: Bearer <token>
  if (!token && req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Retrieve user with employee record to ensure real DB active status
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      employee: {
        include: {
          department: true,
          position: true,
          branch: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;

  return {
    ...payload,
    user,
    employee: user.employee,
  };
}

export function hasRole(currentRole: RoleType, allowedRoles: RoleType[]): boolean {
  if (currentRole === RoleType.SUPER_ADMIN) return true;
  return allowedRoles.includes(currentRole);
}

export function unauthorizedResponse(message = "Bạn không có quyền thực hiện hành động này") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function unauthenticatedResponse(message = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
