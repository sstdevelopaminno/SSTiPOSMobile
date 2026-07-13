import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkoutSchema = z.object({
  paymentMethod: z.enum(["cash", "transfer"]),
  cashReceived: z.coerce.number().min(0).max(1_000_000).optional(),
  referenceNo: z.string().trim().max(120).nullable().optional(),
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

function orderNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `TKO-${stamp}-${suffix}`;
}

export async function POST(request: Request) {
  let orderId: string | null = null;

  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "กรุณาเข้าสู่ระบบ", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "ไม่มีสิทธิ์ขาย", 403);

    const body = checkoutSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "ข้อมูลตะกร้าหรือการชำระเงินไม่ถูกต้อง", 422);

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
    if (!shift) return fail("shift_not_open", "ยังไม่มีกะที่เปิดอยู่", 409);

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
    if (productById.size !== new Set(productIds).size) return fail("product_not_available", "มีสินค้าบางรายการไม่พร้อมขาย", 409);

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
    const total = subtotal;
    const cashReceived = body.data.paymentMethod === "cash" ? Number(body.data.cashReceived ?? 0) : total;
    if (body.data.paymentMethod === "cash" && cashReceived < total) return fail("cash_not_enough", "รับเงินสดน้อยกว่ายอดรวม", 422);

    const nowIso = new Date().toISOString();
    const requestId = crypto.randomUUID();
    const generatedOrderNo = orderNumber();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id: scope.tenantId,
        branch_id: scope.branchId,
        shift_id: shift.id,
        order_no: generatedOrderNo,
        order_type: "takeaway",
        channel: "takeaway",
        subtotal,
        discount_amount: 0,
        total_amount: total,
        grand_total: total,
        tax_total: 0,
        paid_total: 0,
        status: "draft",
        created_by: scope.userId,
        cashier_user_id: scope.userId,
        pos_session_id: scope.sessionId,
        device_code: scope.deviceCode,
        cash_received: body.data.paymentMethod === "cash" ? cashReceived : null,
        change_amount: body.data.paymentMethod === "cash" ? cashReceived - total : 0,
        request_id: requestId,
        metadata: { source_app: "mobile_web", mode: "takeaway", payment_method: body.data.paymentMethod },
      })
      .select("id,order_no")
      .single<{ id: string; order_no: string }>();
    if (orderError || !order) throw new Error(orderError?.message ?? "order_create_failed");
    orderId = order.id;

    const { error: itemError } = await supabase.from("order_items").insert(lines.map((line) => ({
      tenant_id: scope.tenantId,
      branch_id: scope.branchId,
      order_id: order.id,
      product_id: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
      metadata: { source_app: "mobile_web" },
    })));
    if (itemError) throw new Error(itemError.message);

    const { error: paymentError } = await supabase.from("payments").insert({
      tenant_id: scope.tenantId,
      branch_id: scope.branchId,
      order_id: order.id,
      method: body.data.paymentMethod,
      amount: total,
      reference_no: body.data.paymentMethod === "transfer" ? body.data.referenceNo ?? null : null,
      received_by: scope.userId,
      received_at: nowIso,
      request_group_id: requestId,
      shift_id: shift.id,
      pos_session_id: scope.sessionId,
      status: "completed",
      metadata: { source_app: "mobile_web", cash_received: body.data.paymentMethod === "cash" ? cashReceived : null },
    });
    if (paymentError) throw new Error(paymentError.message);

    const { error: completeError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_total: total,
        payment_completed_at: nowIso,
        payment_completed_by: scope.userId,
        updated_at: nowIso,
      })
      .eq("id", order.id)
      .eq("tenant_id", scope.tenantId);
    if (completeError) throw new Error(completeError.message);

    return ok({ orderId: order.id, orderNo: order.order_no, total, paymentMethod: body.data.paymentMethod });
  } catch (error) {
    console.error("[takeaway.checkout]", error);
    if (orderId) {
      await createServiceClient().from("orders").update({ status: "error", updated_at: new Date().toISOString() }).eq("id", orderId);
    }
    return fail("checkout_failed", "บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่", 503);
  }
}
