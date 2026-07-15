import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { HeldOrdersLauncher } from "@/components/sales/held-orders-launcher";
import { SalesModeActions } from "@/components/sales/sales-mode-actions";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { Bell, ChartNoAxesColumnIncreasing, CircleCheck, ClipboardList, PackageOpen, ShoppingCart, type LucideIcon } from "lucide-react";
import Image from "next/image";

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-[#d9e8f7] bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#7a8fa8]">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="m-0 text-base font-bold text-[#0f2745]">{value}</p>
    </div>
  );
}

export default async function SalesPage() {
  const { scope, shift } = await requireOpenShift("sales:view");
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: orders }, { count: productCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,status,grand_total,total_amount")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("shift_id", shift.id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .limit(100),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("is_active", true),
  ]);

  const paidOrders = (orders ?? []).filter((order) => order.status === "paid" || order.status === "completed");
  const activeOrders = (orders ?? []).filter((order) => order.status !== "cancelled");
  const todayTotal = paidOrders.reduce((sum, order) => sum + Number(order.grand_total ?? order.total_amount ?? 0), 0);

  return (
    <MobileAppShell
      brand={
        <div className="mb-1 flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <Image src="/brand/cpipos-symbol.png" alt="CpIPOS" width={64} height={64} className="h-7 w-7 object-contain" priority />
          </span>
          <span className="text-sm font-extrabold tracking-normal text-[#0f2745]">
            Cp<span className="text-[#0b80e8]">IPOS</span>
          </span>
        </div>
      }
      scope={scope}
      action={<Bell size={20} color="#17416f" />}
    >
      <section className="grid gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#d5e7fb] bg-[#edf7ff] p-4 shadow-sm">
          <Image src="/brand/cpipos-symbol.png" alt="" width={220} height={220} className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 object-contain opacity-[0.08]" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1677d9] shadow-sm">
              <ShoppingCart size={32} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-base font-extrabold text-[#0f2745]">พร้อมขาย</h2>
                <span className="rounded-full bg-[#dffbea] px-2 py-0.5 text-[10px] font-bold text-[#0f8d46]">ออนไลน์</span>
              </div>
              <p className="mt-1 text-xs leading-snug text-[#5d7390]">ระบบเชื่อมกับกะและเครื่องแคชเชียร์นี้แล้ว</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1fbd73] shadow-sm">
              <CircleCheck size={20} />
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-[#0f2745]">ทางลัด</h2>
          <SalesModeActions />
        </div>

        <HeldOrdersLauncher />

        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={ChartNoAxesColumnIncreasing} label="ยอดขายวันนี้" value={`${money(todayTotal)} ฿`} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={ClipboardList} label="ออเดอร์ในกะ" value={String(activeOrders.length)} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={PackageOpen} label="สินค้าพร้อมขาย" value={String(productCount ?? 0)} tone="bg-[#f0f6ff] text-[#1677d9]" />
        </div>
      </section>
    </MobileAppShell>
  );
}
