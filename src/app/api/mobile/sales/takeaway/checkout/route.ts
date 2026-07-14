import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkoutSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(["cash", "transfer"]),
  cashReceived: z.coerce.number().min(0).max(1_000_000).optional(),
  referenceNo: z.string().trim().max(120).nullable().optional(),
  discountMode: z.enum(["percent", "amount"]).optional(),
  discountValue: z.coerce.number().min(0).max(1_000_000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(999),
  })).min(1).max(100),
});

type ProductRow = {
  id: string;
  name: string | null;
  price: number | null;
};

export async function POST(request: Request) {
  let orderId: string | null = null;

  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e02\u0e32\u0e22", 403);

    const body = checkoutSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32\u0e2b\u0e23\u0e37\u0e2d\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07", 422);
    orderId = body.data.orderId;

    const supabase = createServiceClient();
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("id")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("device_code", scope.deviceCode)
      .eq("status", "open")
      .maybeSingle<{ id: string }>();
    if (shiftError) throw new Error(shiftError.message);
    if (!shift) return fail("shift_not_open", "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e01\u0e30\u0e17\u0e35\u0e48\u0e40\u0e1b\u0e34\u0e14\u0e2d\u0e22\u0e39\u0e48", 409);

    const { data: draftOrder, error: draftError } = await supabase
      .from("orders")
      .select("id,order_no")
      .eq("id", body.data.orderId)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("shift_id", shift.id)
      .eq("pos_session_id", scope.sessionId)
      .eq("device_code", scope.deviceCode)
      .eq("order_type", "takeaway")
      .eq("status", "draft")
      .maybeSingle<{ id: string; order_no: string }>();
    if (draftError) throw new Error(draftError.message);
    if (!draftOrder) return fail("order_not_found", "\u0e44\u0e21\u0e48\u0e1e\u0e1a draft bill \u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19", 404);

    const requestedItems = body.data.items;
    const productIds = requestedItems.map((item) => item.productId);
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id,name,price")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("is_active", true)
      .in("id", productIds);
    if (productError) throw new Error(productError.message);

    const productById = new Map(((products ?? []) as ProductRow[]).map((product) => [product.id, product]));
    if (productById.size !== new Set(productIds).size) return fail("product_not_available", "\u0e21\u0e35\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e1a\u0e32\u0e07\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e44\u0e21\u0e48\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e02\u0e32\u0e22", 409);

    const lines = requestedItems.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("product_lookup_failed");
      const unitPrice = Number(product.price ?? 0);
      const quantity = Number(item.quantity);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const rawDiscount = Number(body.data.discountValue ?? 0);
    const discountAmount = body.data.discountMode === "percent"
      ? Math.min(subtotal, subtotal * Math.min(rawDiscount, 100) / 100)
      : Math.min(subtotal, rawDiscount);
    const total = Math.max(0, subtotal - discountAmount);
    const cashReceived = body.data.paymentMethod === "cash" ? Number(body.data.cashReceived ?? 0) : total;
    if (body.data.paymentMethod === "cash" && cashReceived < total) return fail("cash_not_enough", "\u0e23\u0e31\u0e1a\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e14\u0e19\u0e49\u0e2d\u0e22\u0e01\u0e27\u0e48\u0e32\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21", 422);

    const nowIso = new Date().toISOString();
    const requestId = crypto.randomUUID();
    const dbPaymentMethod = body.data.paymentMethod === "transfer" ? "bank_transfer" : "cash";

    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("order_id", draftOrder.id);
    if (deleteError) throw new Error(deleteError.message);

    const { error: itemError } = await supabase.from("order_items").insert(lines.map((line) => ({
      tenant_id: scope.tenantId,
      branch_id: scope.branchId,
      order_id: draftOrder.id,
      product_id: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
      metadata: { source_app: "mobile_web" },
    })));
    if (itemError) throw new Error(itemError.message);

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        subtotal,
        discount_amount: discountAmount,
        total_amount: total,
        grand_total: total,
        tax_total: 0,
        paid_total: 0,
        cashier_user_id: scope.userId,
        cash_received: body.data.paymentMethod === "cash" ? cashReceived : null,
        change_amount: body.data.paymentMethod === "cash" ? cashReceived - total : 0,
        request_id: requestId,
        updated_at: nowIso,
        metadata: {
          source_app: "mobile_web",
          mode: "takeaway",
          payment_method: dbPaymentMethod,
          discount_mode: body.data.discountMode ?? "amount",
          discount_value: rawDiscount,
        },
      })
      .eq("id", draftOrder.id)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("status", "draft");
    if (orderError) throw new Error(orderError.message);

    const { error: paymentError } = await supabase.from("payments").insert({
      tenant_id: scope.tenantId,
      branch_id: scope.branchId,
      order_id: draftOrder.id,
      method: dbPaymentMethod,
      amount: total,
      reference_no: body.data.paymentMethod === "transfer" ? body.data.referenceNo ?? null : null,
      received_by: scope.userId,
      received_at: nowIso,
      request_group_id: requestId,
      shift_id: shift.id,
      pos_session_id: scope.sessionId,
      status: "paid",
      metadata: { source_app: "mobile_web", cash_received: body.data.paymentMethod === "cash" ? cashReceived : null },
    });
    if (paymentError) throw new Error(paymentError.message);

    const { error: completeError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        paid_total: total,
        payment_completed_at: nowIso,
        payment_completed_by: scope.userId,
        updated_at: nowIso,
      })
      .eq("id", draftOrder.id)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("status", "draft");
    if (completeError) throw new Error(completeError.message);

    return ok({ orderId: draftOrder.id, orderNo: draftOrder.order_no, total, paymentMethod: body.data.paymentMethod, redirectTo: "/sales" });
  } catch (error) {
    console.error("[takeaway.checkout]", error);
    if (orderId) {
      await createServiceClient().from("orders").update({ updated_at: new Date().toISOString() }).eq("id", orderId);
    }
    return fail("checkout_failed", "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e2d\u0e2d\u0e40\u0e14\u0e2d\u0e23\u0e4c\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48", 503);
  }
}
