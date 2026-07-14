import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusLabel(status: string | null | undefined) {
  if (status === "paid" || status === "completed") return "ชำระแล้ว";
  if (status === "draft") return "กำลังขาย";
  if (status === "held") return "พักบิล";
  if (status === "cancelled") return "ยกเลิก";
  return status ?? "-";
}

export default async function OrdersPage() {
  const { scope, shift } = await requireOpenShift("sales:list:view");
  const supabase = createServiceClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_no,order_type,status,grand_total,total_amount,created_at")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .eq("shift_id", shift.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <MobileAppShell title="รายการขาย" scope={scope}>
      <section className="grid gap-3">
        {(orders ?? []).length ? (orders ?? []).map((order) => (
          <article key={order.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-[#7a8fa8]">{order.order_type ?? "order"}</p>
                <h2 className="m-0 mt-1 truncate text-base font-bold text-[#0f2745]">{order.order_no}</h2>
                <p className="m-0 mt-1 text-xs text-[#7a8fa8]">{order.created_at ? new Date(order.created_at).toLocaleString("th-TH") : "-"}</p>
              </div>
              <div className="text-right">
                <b className="block text-base text-[#1677d9]">{money(order.grand_total ?? order.total_amount)} ฿</b>
                <span className="mt-1 inline-flex rounded-full bg-[#eef6ff] px-2 py-1 text-[10px] font-bold text-[#17416f]">{statusLabel(order.status)}</span>
              </div>
            </div>
          </article>
        )) : (
          <div className="card p-4 text-sm text-[#587398]">ยังไม่มีรายการขายในกะนี้</div>
        )}
      </section>
    </MobileAppShell>
  );
}
