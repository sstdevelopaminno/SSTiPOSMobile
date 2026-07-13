import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Armchair,
  BadgeDollarSign,
  Bell,
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  ClipboardList,
  PackageOpen,
  QrCode,
  ReceiptText,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuickAction({ icon: Icon, title, caption, tone }: { icon: LucideIcon; title: string; caption: string; tone: string }) {
  return (
    <button
      type="button"
      className="min-h-[92px] rounded-xl border border-[#d9e8f7] bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
    >
      <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="block text-xs font-bold text-[#0f2745]">{title}</span>
      <span className="mt-1 block text-[10px] leading-snug text-[#7a8fa8]">{caption}</span>
    </button>
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
    <div className="rounded-xl border border-[#d9e8f7] bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#7a8fa8]">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f6ff] text-[#1677d9]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-base font-bold text-[#0f2745]">{value}</p>
      <p className={`mt-1 text-[10px] font-semibold ${trendTone}`}>{trend}</p>
    </div>
  );
}

function RecentSale({
  channel,
  orderNo,
  amount,
  status,
  tone,
}: {
  channel: string;
  orderNo: string;
  amount: string;
  status: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f7fbff] p-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${tone}`}>
        <ReceiptText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[#0f2745]">{channel}</p>
        <p className="mt-0.5 truncate text-[10px] text-[#7a8fa8]">{orderNo}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-[#0f2745]">{amount}</p>
        <span className="mt-1 inline-flex rounded-full bg-[#eafff1] px-2 py-0.5 text-[10px] font-bold text-[#0f8d46]">
          {status}
        </span>
      </div>
    </div>
  );
}

export default async function SalesPage() {
  const { scope } = await requireOpenShift(["owner", "manager", "staff"]);
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: orders } = await supabase
    .from("orders")
    .select("order_no,grand_total,total_amount,status,created_at")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentOrders = orders ?? [];
  const todayTotal = recentOrders.reduce((sum, order) => sum + Number(order.grand_total ?? order.total_amount ?? 0), 0);

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
      action={<Bell className="h-5 w-5 text-[#17416f]" />}
    >
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#d5e7fb] bg-[#edf7ff] p-4 shadow-sm">
          <Image
            src="/brand/cpipos-symbol.png"
            alt=""
            width={220}
            height={220}
            className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 object-contain opacity-[0.08]"
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1677d9] shadow-sm">
              <ShoppingCart className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0f2745]">พร้อมขาย</h2>
                <span className="rounded-full bg-[#dffbea] px-2 py-0.5 text-[10px] font-bold text-[#0f8d46]">ออนไลน์</span>
              </div>
              <p className="mt-1 text-xs leading-snug text-[#5d7390]">
                ระบบพร้อมรับรายการขาย เชื่อมต่อเครื่องแคชเชียร์นี้แล้ว
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1fbd73] shadow-sm">
              <CircleCheck className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f2745]">ทางลัด</h2>
            <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[#1677d9]">
              ปรับแต่ง
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={ReceiptText} title="เปิดบิล" caption="สร้างคำสั่งซื้อ" tone="bg-[#eef6ff] text-[#1677d9]" />
            <QuickAction icon={QrCode} title="สแกน QR" caption="เพิ่มรายการด่วน" tone="bg-[#f2f0ff] text-[#6d5dfc]" />
            <QuickAction icon={Armchair} title="เลือกโต๊ะ" caption="เปิดโต๊ะลูกค้า" tone="bg-[#fff6e8] text-[#d98600]" />
            <QuickAction icon={BadgeDollarSign} title="รับชำระ" caption="ปิดการขาย" tone="bg-[#eafff1] text-[#0f8d46]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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

        <div className="rounded-2xl border border-[#d9e8f7] bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f2745]">รายการขายล่าสุด</h2>
            <span className="text-xs font-semibold text-[#1677d9]">ดูทั้งหมด</span>
          </div>
          <div className="space-y-2">
            {recentOrders.length ? (
              recentOrders.map((order, index) => (
                <RecentSale
                  key={order.order_no ?? index}
                  channel={index % 2 === 0 ? "โต๊ะ 3" : "กลับบ้าน"}
                  orderNo={order.order_no ?? "ORDER"}
                  amount={`${money(Number(order.grand_total ?? order.total_amount ?? 0))} ฿`}
                  status="ชำระแล้ว"
                  tone={index % 2 === 0 ? "bg-[#1677d9]" : "bg-[#8b6df6]"}
                />
              ))
            ) : (
              <>
                <RecentSale channel="โต๊ะ 3" orderNo="DIN-MOCK-0001" amount="1,280.00 ฿" status="ชำระแล้ว" tone="bg-[#1677d9]" />
                <RecentSale channel="โต๊ะ 7" orderNo="DIN-MOCK-0002" amount="890.00 ฿" status="ชำระแล้ว" tone="bg-[#8b6df6]" />
                <RecentSale channel="แคชเชียร์ Grab #1256" orderNo="TKO-MOCK-0003" amount="650.00 ฿" status="ชำระแล้ว" tone="bg-[#ff9f1c]" />
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#d5e7fb] bg-[#edf7ff] p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#0f2745]">หน้าขาย POS มือถือ</h2>
              <p className="mt-1 text-xs leading-snug text-[#5d7390]">
                พื้นที่นี้พร้อมต่อยอดเป็นแคตตาล็อกสินค้า ตะกร้า และชำระเงิน
              </p>
              <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1677d9] shadow-sm">
                เตรียมออกแบบ
              </span>
            </div>
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-white text-[#1677d9] shadow-sm">
              <ShoppingCart className="h-10 w-10" />
            </div>
          </div>
        </div>
      </section>
    </MobileAppShell>
  );
}
