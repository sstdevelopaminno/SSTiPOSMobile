import { fail, ok } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { verifyEmployeeAndCreateSession } from "@/lib/auth/mobile-auth-service";
import { clearMobileFlow, readMobileFlow } from "@/lib/auth/mobile-flow";
import { setMobileSessionCookie } from "@/lib/auth/session";
import { employeeVerifySchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const flow = await readMobileFlow();
  if (!flow) return fail("context_expired", "เซสชันเข้าสู่ระบบหมดอายุ", 401);
  const body = employeeVerifySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return fail("invalid_input", "ข้อมูลพนักงานไม่ถูกต้อง", 422);
  if (!checkRateLimit(`employee:${flow.tenantId}:${flow.branchId ?? "none"}:${body.data.employeeCode}`)) return fail("rate_limited", "ลองใหม่อีกครั้งภายหลัง", 429);

  const result = await verifyEmployeeAndCreateSession(flow, body.data.employeeCode, body.data.pin);
  if (!result || !flow.branchId) return fail("invalid_credentials", "รหัสพนักงานหรือ PIN ไม่ถูกต้อง", 401);

  const response = ok({ user: result.user, role: result.role, redirectTo: "/dashboard" });
  await setMobileSessionCookie({ tenantId: flow.tenantId, branchId: flow.branchId, userId: result.user.id, role: result.role, sessionId: result.sessionId });
  clearMobileFlow(response);
  return response;
}
