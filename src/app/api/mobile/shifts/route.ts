import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const shiftActionSchema = z.object({
  action: z.enum(["open", "close"]),
  openingCash: z.coerce.number().min(0).max(1_000_000).optional(),
  closingCash: z.coerce.number().min(0).max(1_000_000).optional(),
});

type OpenShiftRow = {
  id: string;
  status: string;
  opened_at: string | null;
  opened_by: string | null;
  opening_cash: number | null;
  expected_cash: number | null;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "กรุณาเข้าสู่ระบบ", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "ไม่มีสิทธิ์เปิดหรือปิดยอด", 403);

    const body = shiftActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "คำสั่งกะไม่ถูกต้อง", 422);
    if (body.data.action === "open" && body.data.openingCash === undefined) return fail("opening_cash_required", "กรุณากรอกเงินทอนเริ่มต้น", 422);
    if (body.data.action === "close" && body.data.closingCash === undefined) return fail("closing_cash_required", "กรุณากรอกเงินสดปิดกะ", 422);

    const supabase = createServiceClient();
    const { data: openShift, error: openError } = await supabase
      .from("shifts")
      .select("id,status,opened_at,opened_by,opening_cash,expected_cash")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("device_code", scope.deviceCode)
      .eq("status", "open")
      .maybeSingle<OpenShiftRow>();
    if (openError) throw new Error(openError.message);

    if (body.data.action === "open") {
      if (openShift) {
        await supabase
          .from("pos_sessions")
          .update({ shift_id: openShift.id })
          .eq("id", scope.sessionId)
          .eq("tenant_id", scope.tenantId)
          .eq("branch_id", scope.branchId);
        return ok({ shiftId: openShift.id, status: "open", alreadyOpen: true, redirectTo: "/sales" });
      }

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
          metadata: { source_app: "mobile_web", device_id: scope.deviceId, session_id: scope.sessionId, opening_cash: openingCash },
        })
        .select("id,status,opened_at,opening_cash")
        .single();
      if (error || !data) throw new Error(error?.message ?? "shift_open_failed");

      await supabase
        .from("pos_sessions")
        .update({ shift_id: data.id })
        .eq("id", scope.sessionId)
        .eq("tenant_id", scope.tenantId)
        .eq("branch_id", scope.branchId);

      return ok({ shift: data, redirectTo: "/sales" });
    }

    if (!openShift) return fail("shift_not_open", "ยังไม่มีกะที่เปิดอยู่", 409);
    if (scope.role === "staff" && openShift.opened_by && openShift.opened_by !== scope.userId) {
      return fail("shift_close_forbidden", "พนักงานปิดได้เฉพาะกะที่เปิดเอง", 403);
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id,status,grand_total,total_amount")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("shift_id", openShift.id);
    if (ordersError) throw new Error(ordersError.message);

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("method,amount")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("shift_id", openShift.id)
      .eq("status", "completed");
    if (paymentsError) throw new Error(paymentsError.message);

    const summary = {
      order_count: 0,
      cancelled_order_count: 0,
      sales_total: 0,
      cash_total: 0,
      transfer_total: 0,
    };
    for (const order of orders ?? []) {
      if (order.status === "cancelled") {
        summary.cancelled_order_count += 1;
      } else {
        summary.order_count += 1;
        summary.sales_total += toNumber(order.grand_total ?? order.total_amount);
      }
    }
    for (const payment of payments ?? []) {
      if (payment.method === "cash") summary.cash_total += toNumber(payment.amount);
      if (payment.method === "bank_transfer") summary.transfer_total += toNumber(payment.amount);
    }

    const nowIso = new Date().toISOString();
    const closingCash = Number(body.data.closingCash ?? 0);
    const expectedCash = toNumber(openShift.opening_cash) + summary.cash_total;
    const { data, error } = await supabase
      .from("shifts")
      .update({
        status: "closed",
        closed_by: scope.userId,
        closed_at: nowIso,
        expected_cash: expectedCash,
        actual_cash: closingCash,
        closing_cash: closingCash,
        updated_at: nowIso,
        metadata: {
          source_app: "mobile_web",
          device_id: scope.deviceId,
          session_id: scope.sessionId,
          closing_cash: closingCash,
          expected_cash: expectedCash,
          cash_difference: closingCash - expectedCash,
          summary,
        },
      })
      .eq("id", openShift.id)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("status", "open")
      .select("id,status,closed_at,expected_cash,actual_cash,closing_cash")
      .single();
    if (error || !data) throw new Error(error?.message ?? "shift_close_failed");

    await supabase
      .from("pos_sessions")
      .update({ shift_id: null })
      .eq("id", scope.sessionId)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId);

    return ok({ shift: data, summary, redirectTo: "/shifts" });
  } catch (error) {
    console.error("[mobile.shifts]", error);
    return fail("shift_action_error", "ทำรายการกะไม่สำเร็จ กรุณาลองใหม่", 503);
  }
}
