import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { Armchair, Bell, Bike, ChartNoAxesColumnIncreasing, CircleCheck, ClipboardList, PackageOpen, ReceiptText, ShoppingCart, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuickAction({ href, icon: Icon, title, caption, tone }: { href: string; icon: LucideIcon; title: string; caption: string; tone: string }) {
  return (
    <Link href={href} className="block min-h-[92px] rounded-xl border border-[#d9e8f7] bg-white p-3 text-left no-underline shadow-sm active:scale-[0.98]">
      <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </span>
      <span className="block text-xs font-bold text-[#0f2745]">{title}</span>
      <span className="mt-1 block text-[10px] leading-snug text-[#7a8fa8]">{caption}</span>
    </Link>
  );
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
  const [{ data: orders }, { data: products }] = await Promise.all([
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
      .select("id")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("is_active", true)
      .limit(500),
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
          <div className="grid grid-cols-3 gap-2">
            <QuickAction href="/sales/takeaway" icon={ReceiptText} title="กลับบ้าน" caption="เปิดออเดอร์" tone="bg-[#eef6ff] text-[#1677d9]" />
            <QuickAction href="/sales/table" icon={Armchair} title="เลือกโต๊ะ" caption="เปิดโต๊ะลูกค้า" tone="bg-[#fff6e8] text-[#d98600]" />
            <QuickAction href="/sales/delivery" icon={Bike} title="เดลิเวอรี่" caption="เปิดออเดอร์ส่ง" tone="bg-[#f2f0ff] text-[#6d5dfc]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={ChartNoAxesColumnIncreasing} label="ยอดขายวันนี้" value={`${money(todayTotal)} ฿`} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={ClipboardList} label="ออเดอร์ในกะ" value={String(activeOrders.length)} tone="bg-[#f0f6ff] text-[#1677d9]" />
          <StatCard icon={PackageOpen} label="สินค้าพร้อมขาย" value={String(products?.length ?? 0)} tone="bg-[#f0f6ff] text-[#1677d9]" />
        </div>
      </section>
    </MobileAppShell>
  );
}
