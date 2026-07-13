import { fail, ok } from "@/lib/api/response";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const holdSchema = z.object({
  orderId: z.string().uuid(),
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
  try {
    const scope = await readMobileSession();
    if (!scope) return fail("missing_session", "Please sign in", 401);
    if (!["owner", "manager", "staff"].includes(scope.role)) return fail("forbidden", "Forbidden", 403);

    const body = holdSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) return fail("invalid_input", "Invalid held order data", 422);

    const supabase = createServiceClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,order_no")
      .eq("id", body.data.orderId)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("pos_session_id", scope.sessionId)
      .eq("order_type", "takeaway")
      .eq("status", "draft")
      .maybeSingle<{ id: string; order_no: string }>();
    if (orderError) throw new Error(orderError.message);
    if (!order) return fail("order_not_found", "Draft order not found", 404);

    const productIds = body.data.items.map((item) => item.productId);
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id,name,price")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("is_active", true)
      .in("id", productIds);
    if (productError) throw new Error(productError.message);

    const productById = new Map(((products ?? []) as ProductRow[]).map((product) => [product.id, product]));
    if (productById.size !== new Set(productIds).size) return fail("product_not_available", "Some products are not available", 409);

    const lines = body.data.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("product_lookup_failed");
      const quantity = Number(item.quantity);
      const unitPrice = Number(product.price ?? 0);
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
    const nowIso = new Date().toISOString();

    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("order_id", order.id);
    if (deleteError) throw new Error(deleteError.message);

    const { error: itemError } = await supabase.from("order_items").insert(lines.map((line) => ({
      tenant_id: scope.tenantId,
      branch_id: scope.branchId,
      order_id: order.id,
      product_id: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
      metadata: { source_app: "mobile_web", mode: "takeaway_hold" },
    })));
    if (itemError) throw new Error(itemError.message);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        subtotal,
        discount_amount: discountAmount,
        total_amount: total,
        grand_total: total,
        status: "held",
        updated_at: nowIso,
        metadata: {
          source_app: "mobile_web",
          mode: "takeaway",
          held_from: "mobile_takeaway",
          held_by: scope.userId,
          held_at: nowIso,
          discount_mode: body.data.discountMode ?? "amount",
          discount_value: rawDiscount,
        },
      })
      .eq("id", order.id)
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("status", "draft");
    if (updateError) throw new Error(updateError.message);

    return ok({ held: true, orderId: order.id, orderNo: order.order_no, total, redirectTo: "/sales/takeaway" });
  } catch (error) {
    console.error("[takeaway.hold]", error);
    return fail("hold_failed", "Hold order failed", 503);
  }
}
