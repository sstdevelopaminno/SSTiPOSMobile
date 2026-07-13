import "server-only";

import { cookies } from "next/headers";
import { decodeMobileSessionToken, encodeMobileSessionToken } from "@/lib/auth/session-token";
import { getEnv } from "@/lib/env";
import type { MobileScope } from "@/types/contracts";

export async function setMobileSessionCookie(scope: MobileScope) {
  const env = getEnv();
  const exp = Date.now() + env.MOBILE_SESSION_TTL_HOURS * 3600000;
  const token = encodeMobileSessionToken(scope, exp);
  (await cookies()).set(env.MOBILE_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp)
  });
}

export async function clearMobileSessionCookie() {
  (await cookies()).delete(getEnv().MOBILE_SESSION_COOKIE_NAME);
}

export async function readMobileSession(): Promise<MobileScope | null> {
  const raw = (await cookies()).get(getEnv().MOBILE_SESSION_COOKIE_NAME)?.value;
  return raw ? decodeMobileSessionToken(raw) : null;
}
