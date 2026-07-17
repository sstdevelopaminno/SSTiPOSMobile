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
    <div className="min-h-[104px] rounded-[18px] border border-[#d4e5f8] bg-white p-3.5 shadow-[0_8px_20px_rgba(15,39,69,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[12px] font-black leading-tight text-[#6a7f99]">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${tone}`}>
          <Icon size={20} strokeWidth={2.3} />
        </span>
      </div>
      <p className="m-0 text-[20px] font-black leading-tight text-[#031f3d]">{value}</p>
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
        <div className="mb-1 flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,39,69,0.08)]">
            <Image src="/brand/cpipos-symbol.png" alt="CpIPOS" width={72} height={72} className="h-9 w-9 object-contain" priority />
          </span>
          <span className="text-[18px] font-black leading-none tracking-normal text-[#0f2745]">
            Cp<span className="text-[#0b80e8]">IPOS</span>
          </span>
        </div>
      }
      scope={scope}
      action={<Bell size={24} color="#17416f" />}
    >
      <section className="grid gap-5">
        <div className="relative overflow-hidden rounded-[22px] border border-[#cfe3fa] bg-[#eaf6ff] p-4 shadow-[0_10px_26px_rgba(15,39,69,0.08)]">
          <Image src="/brand/cpipos-symbol.png" alt="" width={240} height={240} className="pointer-events-none absolute -right-11 -top-14 h-40 w-40 object-contain opacity-[0.08]" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-white text-[#1677d9] shadow-sm">
              <ShoppingCart size={36} strokeWidth={2.3} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-[20px] font-black leading-tight text-[#0f2745]">พร้อมขาย</h2>
                <span className="rounded-full bg-[#dffbea] px-3 py-1 text-[12px] font-black text-[#0f8d46]">ออนไลน์</span>
              </div>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-[#587398]">ระบบเชื่อมกับกะและเครื่องแคชเชียร์นี้แล้ว</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1fbd73] shadow-sm">
              <CircleCheck size={24} strokeWidth={2.4} />
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-[16px] font-black leading-tight text-[#0f2745]">ทางลัด</h2>
          <SalesModeActions />
        </div>

        <HeldOrdersLauncher />

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={ChartNoAxesColumnIncreasing} label="ยอดขายวันนี้" value={`${money(todayTotal)} ฿`} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={ClipboardList} label="ออเดอร์ในกะ" value={String(activeOrders.length)} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={PackageOpen} label="สินค้าพร้อมขาย" value={String(productCount ?? 0)} tone="bg-[#f0f6ff] text-[#1677d9]" />
        </div>
      </section>
    </MobileAppShell>
  );
}
