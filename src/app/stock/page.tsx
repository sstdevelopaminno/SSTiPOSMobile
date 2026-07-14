import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function StockPage() {
  const { scope } = await requireOpenShift("inventory:view");
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select("id,sku,name,category,price,is_active,updated_at")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .order("category", { ascending: true })
    .order("name", { ascending: true })
    .limit(100);

  const activeCount = (products ?? []).filter((item) => item.is_active).length;
  const categories = new Set((products ?? []).map((item) => String(item.category ?? "-")));

  return (
    <MobileAppShell title="สินค้า" scope={scope}>
      <section className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3">
            <p className="m-0 text-xs font-semibold text-[#587398]">สินค้าพร้อมขาย</p>
            <b className="mt-2 block text-xl text-[#0f2745]">{activeCount}</b>
          </div>
          <div className="card p-3">
            <p className="m-0 text-xs font-semibold text-[#587398]">หมวดสินค้า</p>
            <b className="mt-2 block text-xl text-[#0f2745]">{categories.size}</b>
          </div>
        </div>

        {(products ?? []).length ? (products ?? []).map((product) => (
          <article key={product.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-[#7a8fa8]">{product.category ?? "-"}</p>
                <h2 className="m-0 mt-1 truncate text-base font-bold text-[#0f2745]">{product.name}</h2>
                <p className="m-0 mt-1 text-xs text-[#7a8fa8]">{product.sku}</p>
              </div>
              <div className="text-right">
                <b className="block text-base text-[#1677d9]">{money(product.price)} ฿</b>
                <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${product.is_active ? "bg-[#dffbea] text-[#0f8d46]" : "bg-[#f2f4f7] text-[#7a8fa8]"}`}>
                  {product.is_active ? "เปิดขาย" : "ปิดขาย"}
                </span>
              </div>
            </div>
          </article>
        )) : (
          <div className="card p-4 text-sm text-[#587398]">ยังไม่มีสินค้าในสาขานี้</div>
        )}
      </section>
    </MobileAppShell>
  );
}
