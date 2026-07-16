import "server-only";

import { cookies } from "next/headers";
import { decodeMobileSessionToken, encodeMobileSessionToken } from "@/lib/auth/session-token";
import { getEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
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

export async function requireActiveMobileSession(options: { refreshCookie?: boolean } = {}): Promise<MobileScope | null> {
  const scope = await readMobileSession();
  if (!scope) return null;

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("pos_sessions")
    .select("id,status,expires_at,tenant_id,branch_id,user_id,device_id,device_code,role")
    .eq("id", scope.sessionId)
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .eq("user_id", scope.userId)
    .eq("device_id", scope.deviceId)
    .maybeSingle<{
      id: string;
      status: string | null;
      expires_at: string | null;
      tenant_id: string;
      branch_id: string;
      user_id: string;
      device_id: string;
      device_code: string | null;
      role: string | null;
    }>();
  if (error || !session) return null;
  if (session.status !== "active") return null;
  if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) return null;
  if (session.device_code !== scope.deviceCode || session.role !== scope.role) return null;

  if (options.refreshCookie) await setMobileSessionCookie(scope);
  return scope;
}
