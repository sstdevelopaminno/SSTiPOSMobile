import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { TakeawayCartShell, type ReceiptStoreProfile, type TakeawayCategory, type TakeawayProduct } from "@/components/sales/takeaway-cart-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  sku: string | null;
  name: string | null;
  category: string | null;
  price: number | null;
  sell_unit: string | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

type DraftOrderRow = {
  id: string;
  order_no: string;
};

type TenantStoreProfileRow = {
  name: string | null;
  display_name: string | null;
  logo_url: string | null;
  company_address: string | null;
  contact_phone: string | null;
  owner_phone: string | null;
};

type BranchRow = {
  name: string | null;
};

const ALL_CATEGORY = "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14";
const OTHER_CATEGORY = "\u0e2d\u0e37\u0e48\u0e19\u0e46";
const LABEL_FALLBACK_STORE = "\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32";

function orderNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `TKO-${stamp}-${suffix}`;
}

export default async function TakeawaySalesPage() {
  const { scope, shift } = await requireOpenShift(["owner", "manager", "staff"]);
  const supabase = createServiceClient();

  const [{ data: categoryRows }, { data: productRows }, { data: existingDraft, error: draftLookupError }, { data: tenantProfile }, { data: branchProfile }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id,name")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("id,sku,name,category,price,sell_unit")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("orders")
      .select("id,order_no")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("shift_id", shift.id)
      .eq("pos_session_id", scope.sessionId)
      .eq("device_code", scope.deviceCode)
      .eq("order_type", "takeaway")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<DraftOrderRow>(),
    supabase
      .from("tenants")
      .select("name,display_name,logo_url,company_address,contact_phone,owner_phone")
      .eq("id", scope.tenantId)
      .maybeSingle<TenantStoreProfileRow>(),
    supabase
      .from("branches")
      .select("name")
      .eq("id", scope.branchId)
      .eq("tenant_id", scope.tenantId)
      .maybeSingle<BranchRow>(),
  ]);
  if (draftLookupError) throw new Error(draftLookupError.message);

  let orderId = existingDraft?.id;
  let orderNo = existingDraft?.order_no;
  if (!orderId || !orderNo) {
    const { data: createdDraft, error: draftCreateError } = await supabase
      .from("orders")
      .insert({
        tenant_id: scope.tenantId,
        branch_id: scope.branchId,
        shift_id: shift.id,
        order_no: orderNumber(),
        order_type: "takeaway",
        channel: "takeaway",
        subtotal: 0,
        discount_amount: 0,
        total_amount: 0,
        grand_total: 0,
        tax_total: 0,
        paid_total: 0,
        status: "draft",
        created_by: scope.userId,
        cashier_user_id: scope.userId,
        pos_session_id: scope.sessionId,
        device_code: scope.deviceCode,
        request_id: crypto.randomUUID(),
        metadata: { source_app: "mobile_web", mode: "takeaway", opened_from: "sales_mode" },
      })
      .select("id,order_no")
      .single<DraftOrderRow>();
    if (draftCreateError || !createdDraft) throw new Error(draftCreateError?.message ?? "draft_order_create_failed");
    orderId = createdDraft.id;
    orderNo = createdDraft.order_no;
  }

  const products: TakeawayProduct[] = ((productRows ?? []) as ProductRow[])
    .filter((product) => product.id && product.name)
    .map((product) => ({
      id: product.id,
      sku: product.sku,
      name: String(product.name),
      category: String(product.category || OTHER_CATEGORY),
      price: Number(product.price ?? 0),
      sellUnit: product.sell_unit,
    }));

  const categoryNames = new Set<string>();
  for (const category of (categoryRows ?? []) as CategoryRow[]) {
    if (category.name) categoryNames.add(category.name);
  }
  for (const product of products) categoryNames.add(product.category);

  const categories: TakeawayCategory[] = [
    { id: "all", name: ALL_CATEGORY },
    ...Array.from(categoryNames).sort((a, b) => a.localeCompare(b, "th")).map((name) => ({ id: name, name })),
  ];
  const receiptStoreProfile: ReceiptStoreProfile = {
    displayName: String(tenantProfile?.display_name || tenantProfile?.name || LABEL_FALLBACK_STORE),
    logoUrl: String(tenantProfile?.logo_url || "/brand/cpipos-symbol.png"),
    companyAddress: String(tenantProfile?.company_address || ""),
    contactPhone: String(tenantProfile?.contact_phone || tenantProfile?.owner_phone || ""),
    branchName: String(branchProfile?.name || scope.branchId),
  };

  return (
    <MobileAppShell scope={scope}>
      <TakeawayCartShell categories={categories} products={products} orderId={orderId} orderNo={orderNo} receiptStoreProfile={receiptStoreProfile} />
    </MobileAppShell>
  );
}
