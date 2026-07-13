import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Armchair,
  Bell,
  Bike,
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  ClipboardList,
  PackageOpen,
  ReceiptText,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuickAction({ href, icon: Icon, title, caption, tone }: { href: string; icon: LucideIcon; title: string; caption: string; tone: string }) {
  return (
    <Link
      href={href}
      className="min-h-[92px] rounded-xl border border-[#d9e8f7] bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
      style={{
        display: "block",
        minHeight: 92,
        border: "1px solid #d9e8f7",
        borderRadius: 12,
        background: "#fff",
        padding: 12,
        textAlign: "left",
        textDecoration: "none",
        boxShadow: "0 4px 12px rgba(15,39,69,0.06)",
      }}
    >
      <span
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
        style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, marginBottom: 8 }}
      >
        <Icon size={20} />
      </span>
      <span className="block text-xs font-bold text-[#0f2745]" style={{ display: "block", color: "#0f2745", fontSize: 12, fontWeight: 800 }}>
        {title}
      </span>
      <span className="mt-1 block text-[10px] leading-snug text-[#7a8fa8]" style={{ display: "block", marginTop: 4, color: "#7a8fa8", fontSize: 10, lineHeight: 1.25 }}>
        {caption}
      </span>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: string;
  trendTone: string;
}) {
  return (
    <div
      className="rounded-xl border border-[#d9e8f7] bg-white p-3 shadow-sm"
      style={{ border: "1px solid #d9e8f7", borderRadius: 12, background: "#fff", padding: 12, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
    >
      <div className="mb-2 flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="text-[10px] font-semibold text-[#7a8fa8]" style={{ color: "#7a8fa8", fontSize: 10, fontWeight: 700 }}>
          {label}
        </span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f6ff] text-[#1677d9]"
          style={{ display: "flex", width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#f0f6ff", color: "#1677d9" }}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="text-base font-bold text-[#0f2745]" style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 800 }}>
        {value}
      </p>
      <p className={`mt-1 text-[10px] font-semibold ${trendTone}`} style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 700 }}>
        {trend}
      </p>
    </div>
  );
}

export default async function SalesPage() {
  const { scope } = await requireOpenShift(["owner", "manager", "staff"]);
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: orders } = await supabase
    .from("orders")
    .select("grand_total,total_amount")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .limit(50);

  const recentOrders = orders ?? [];
  const todayTotal = recentOrders.reduce((sum, order) => sum + Number(order.grand_total ?? order.total_amount ?? 0), 0);

  return (
    <MobileAppShell
      brand={
        <div className="mb-1 flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ position: "relative", display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 12, background: "#fff", boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
          >
            <Image src="/brand/cpipos-symbol.png" alt="CpIPOS" width={64} height={64} className="h-7 w-7 object-contain" style={{ width: 28, height: 28, objectFit: "contain" }} priority />
          </span>
          <span className="text-sm font-extrabold tracking-normal text-[#0f2745]" style={{ color: "#0f2745", fontSize: 14, fontWeight: 900, letterSpacing: 0 }}>
            Cp<span className="text-[#0b80e8]" style={{ color: "#0b80e8" }}>IPOS</span>
          </span>
        </div>
      }
      scope={scope}
      action={<Bell size={20} color="#17416f" />}
    >
      <section className="space-y-4" style={{ display: "grid", gap: 16 }}>
        <div
          className="relative overflow-hidden rounded-2xl border border-[#d5e7fb] bg-[#edf7ff] p-4 shadow-sm"
          style={{ position: "relative", overflow: "hidden", border: "1px solid #d5e7fb", borderRadius: 16, background: "#edf7ff", padding: 16, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
        >
          <Image
            src="/brand/cpipos-symbol.png"
            alt=""
            width={220}
            height={220}
            className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 object-contain opacity-[0.08]"
            style={{ position: "absolute", top: -48, right: -40, width: 144, height: 144, objectFit: "contain", opacity: 0.08, pointerEvents: "none" }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1677d9] shadow-sm"
              style={{ display: "flex", width: 56, height: 56, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 16, background: "#fff", color: "#1677d9", boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
            >
              <ShoppingCart size={32} />
            </span>
            <div className="min-w-0 flex-1" style={{ minWidth: 0, flex: 1 }}>
              <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 className="text-base font-extrabold text-[#0f2745]" style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 900 }}>
                  พร้อมขาย
                </h2>
                <span className="rounded-full bg-[#dffbea] px-2 py-0.5 text-[10px] font-bold text-[#0f8d46]" style={{ borderRadius: 999, background: "#dffbea", padding: "2px 8px", color: "#0f8d46", fontSize: 10, fontWeight: 800 }}>
                  ออนไลน์
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-[#5d7390]" style={{ margin: "4px 0 0", color: "#5d7390", fontSize: 12, lineHeight: 1.35 }}>
                ระบบพร้อมรับรายการขาย เชื่อมต่อเครื่องแคชเชียร์นี้แล้ว
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1fbd73] shadow-sm"
              style={{ display: "flex", width: 36, height: 36, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#fff", color: "#1fbd73", boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
            >
              <CircleCheck size={20} />
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 className="text-sm font-bold text-[#0f2745]" style={{ margin: 0, color: "#0f2745", fontSize: 14, fontWeight: 800 }}>
              ทางลัด
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-semibold text-[#1677d9]"
              style={{ display: "flex", minHeight: 0, alignItems: "center", gap: 4, border: 0, background: "transparent", color: "#1677d9", padding: 0, fontSize: 12, fontWeight: 700 }}
            >
              ปรับแต่ง
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            <QuickAction href="/sales/takeaway" icon={ReceiptText} title="กลับบ้าน" caption="เปิดออเดอร์" tone="bg-[#eef6ff] text-[#1677d9]" />
            <QuickAction href="/sales/table" icon={Armchair} title="เลือกโต๊ะ" caption="เปิดโต๊ะลูกค้า" tone="bg-[#fff6e8] text-[#d98600]" />
            <QuickAction href="/sales/delivery" icon={Bike} title="เดอรีเวอรี่" caption="เปิดออเดอร์ส่ง" tone="bg-[#f2f0ff] text-[#6d5dfc]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <StatCard
            icon={ChartNoAxesColumnIncreasing}
            label="ยอดขายวันนี้"
            value={`${money(todayTotal || 24650)} ฿`}
            trend="+18% จากเมื่อวาน"
            trendTone="text-[#0f8d46]"
          />
          <StatCard
            icon={ClipboardList}
            label="ออเดอร์"
            value={String(recentOrders.length || 42)}
            trend="+12% จากเมื่อวาน"
            trendTone="text-[#0f8d46]"
          />
          <StatCard icon={PackageOpen} label="สินค้าใกล้หมด" value="5" trend="-2 รายการเตือน" trendTone="text-[#e25141]" />
        </div>
      </section>
    </MobileAppShell>
  );
}
