import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const shiftActionSchema = z.object({
  action: z.enum(["open", "close"]),
  openingCash: z.coerce.number().min(0).max(1_000_000).optional()
});

export async function POST(request: Request) {
  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "กรุณาเข้าสู่ระบบ", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "ไม่มีสิทธิ์เปิดหรือปิดยอด", 403);

    const body = shiftActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "คำสั่งกะไม่ถูกต้อง", 422);
    if (body.data.action === "open" && body.data.openingCash === undefined) return fail("opening_cash_required", "กรุณากรอกจำนวนเงินทอนเริ่มต้น", 422);

    const supabase = createServiceClient();
    const { data: openShift, error: openError } = await supabase
      .from("shifts")
      .select("id,status")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("device_code", scope.deviceCode)
      .eq("status", "open")
      .maybeSingle<{ id: string; status: string }>();
    if (openError) throw new Error(openError.message);

    if (body.data.action === "open") {
      if (openShift) return ok({ shiftId: openShift.id, status: "open", alreadyOpen: true, redirectTo: "/sales" });
      const nowIso = new Date().toISOString();
      const openingCash = Number(body.data.openingCash ?? 0);
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          tenant_id: scope.tenantId,
          branch_id: scope.branchId,
          opened_by: scope.userId,
          opened_at: nowIso,
          opening_cash: openingCash,
          expected_cash: openingCash,
          status: "open",
          device_code: scope.deviceCode,
          metadata: { source_app: "mobile_web", device_id: scope.deviceId, session_id: scope.sessionId, opening_cash: openingCash }
        })
        .select("id,status,opened_at,opening_cash")
        .single();
      if (error || !data) throw new Error(error?.message ?? "shift_open_failed");
      return ok({ shift: data, redirectTo: "/sales" });
    }

    if (!openShift) return fail("shift_not_open", "ยังไม่มีกะที่เปิดอยู่", 409);
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("shifts")
      .update({
        status: "closed",
        closed_by: scope.userId,
        closed_at: nowIso,
        actual_cash: 0,
        closing_cash: 0,
        updated_at: nowIso
      })
      .eq("id", openShift.id)
      .eq("tenant_id", scope.tenantId)
      .select("id,status,closed_at")
      .single();
    if (error || !data) throw new Error(error?.message ?? "shift_close_failed");
    return ok({ shift: data, redirectTo: "/shifts" });
  } catch (error) {
    console.error("[mobile.shifts]", error);
    return fail("shift_action_error", "ทำรายการกะไม่สำเร็จ กรุณาลองใหม่", 503);
  }
}
