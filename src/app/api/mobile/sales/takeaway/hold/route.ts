import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const holdSchema = z.object({
  orderId: z.string().uuid(),
  discountMode: z.enum(["percent", "amount"]).optional(),
  discountValue: z.coerce.number().min(0).max(1_000_000).optional(),
  memberId: z.string().uuid().optional(),
  memberPoints: z.coerce.number().int().min(-1_000_000).max(1_000_000).optional(),
  memberStamps: z.coerce.number().int().min(-1_000_000).max(1_000_000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(999),
  })).max(100),
});

type HoldResult = {
  order_id: string;
  order_no: string;
  total: number;
};

function isMissingRpcSignature(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Could not find the function") || message.includes("schema cache");
}

function holdRpcFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("draft_order_not_found")) return fail("order_not_found", "ไม่พบ draft bill", 404);
  if (message.includes("product_not_available")) return fail("product_not_available", "มีสินค้าบางรายการไม่พร้อมขาย", 409);
  return fail("hold_failed", "พักบิลไม่สำเร็จ กรุณาลองใหม่", 503);
}

export async function POST(request: Request) {
  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "กรุณาเข้าสู่ระบบ", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "ไม่มีสิทธิ์พักบิล", 403);

    const body = holdSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "ข้อมูลบิลพักไม่ถูกต้อง", 422);

    const supabase = createServiceClient();
    const commonPayload = {
      p_tenant_id: scope.tenantId,
      p_branch_id: scope.branchId,
      p_session_id: scope.sessionId,
      p_user_id: scope.userId,
      p_order_id: body.data.orderId,
      p_discount_mode: body.data.discountMode ?? "amount",
      p_discount_value: body.data.discountValue ?? 0,
      p_items: body.data.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    };

    const firstAttempt = await supabase.rpc("mobile_takeaway_hold_bill", {
      ...commonPayload,
      p_member_id: body.data.memberId ?? null,
      p_member_points: body.data.memberPoints ?? 0,
      p_member_stamps: body.data.memberStamps ?? 0,
    }).single<HoldResult>();

    const result = firstAttempt.error && isMissingRpcSignature(firstAttempt.error)
      ? await supabase.rpc("mobile_takeaway_hold_bill", commonPayload).single<HoldResult>()
      : firstAttempt;

    if (result.error) throw new Error(result.error.message);
    if (!result.data) return fail("order_not_found", "ไม่พบ draft bill", 404);

    return ok({
      held: true,
      orderId: result.data.order_id,
      orderNo: result.data.order_no,
      total: Number(result.data.total ?? 0),
      redirectTo: "/sales",
    });
  } catch (error) {
    console.error("[takeaway.hold]", error);
    return holdRpcFailure(error);
  }
}
