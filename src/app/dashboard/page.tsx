import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireMobileSession } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { Clock, Monitor, ShieldCheck, Store, UserRound } from "lucide-react";
import Link from "next/link";

function Field({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef6ff] text-[#1677d9]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-[#587398]">{label}</span>
        <b className="block break-words text-sm text-[#0f2745]">{value}</b>
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const scope = await requireMobileSession();
  const supabase = createServiceClient();
  const [{ data: tenant }, { data: branch }, { data: user }, { data: shift }, { data: orders }, { data: lowStock }] = await Promise.all([
    supabase.from("tenants").select("name,code").eq("id", scope.tenantId).maybeSingle(),
    supabase.from("branches").select("name,code").eq("id", scope.branchId).maybeSingle(),
    supabase.from("users_profiles").select("full_name,email").eq("id", scope.userId).maybeSingle(),
    supabase.from("shifts").select("id,status,opened_at,device_code").eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId).eq("device_code", scope.deviceCode).eq("status", "open").maybeSingle(),
    supabase.from("orders").select("order_no,grand_total,total_amount,status,created_at").eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId).order("created_at", { ascending: false }).limit(5),
    supabase.from("ingredients").select("name,quantity_on_hand,base_unit").eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId).lt("quantity_on_hand", 10).limit(5)
  ]);

  const branchName = String(branch?.name ?? branch?.code ?? "-");
  const userName = String(user?.full_name ?? user?.email ?? scope.userId);
  const deviceName = scope.deviceName ? `${scope.deviceName} (${scope.deviceCode})` : scope.deviceCode;

  if (!shift) {
    const canOpenShift = scope.role === "owner" || scope.role === "manager" || scope.role === "staff";
    return (
      <main className="min-h-dvh bg-[#f5f8fb] px-4 py-5">
        <section className="mx-auto max-w-[520px] rounded-[18px] border border-[#cfdff2] bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1677d9]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-[#0f2745]">กรุณาเปิดกะก่อนทุกครั้ง</h1>
              <p className="mt-1 text-xs text-[#587398]">ยังไม่พบกะที่เปิดอยู่สำหรับ session นี้ กรุณาไปเมนูปิดยอดเพื่อเปิดกะก่อนเข้าหน้าขาย</p>
            </div>
          </div>

          <h2 className="mb-3 text-sm font-bold text-[#1677d9]">สรุปก่อนเข้า POS</h2>
          <div className="grid gap-4">
            <Field icon={Store} label="ร้าน" value={String(tenant?.name ?? tenant?.code ?? "-")} />
            <Field icon={Store} label="สาขา" value={branchName} />
            <Field icon={UserRound} label="ผู้ใช้งาน" value={userName} />
            <Field icon={ShieldCheck} label="บทบาท" value={scope.role} />
            <Field icon={Monitor} label="เครื่องแคชเชียร์" value={deviceName} />
            <Field icon={Monitor} label="สถานะเครื่อง" value="ใช้งาน" />
            <Field icon={Clock} label="สถานะกะ" value="ยังไม่เปิด" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {canOpenShift ? (
              <Link href="/shifts" className="rounded-xl bg-[#1677d9] px-4 py-3 text-sm font-semibold text-white">
                ไปเมนูปิดยอด
              </Link>
            ) : null}
            <Link href="/dashboard" className="rounded-xl border border-[#bcd5f5] bg-white px-4 py-3 text-sm font-semibold text-[#17416f]">
              ตรวจสอบอีกครั้ง
            </Link>
            <Link href="/login/store" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#17416f]">
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const total = orders?.reduce((sum, order) => sum + Number(order.grand_total ?? order.total_amount ?? 0), 0) ?? 0;

  return (
    <MobileAppShell title="แดชบอร์ด" scope={scope}>
      <section className="space-y-3">
        <div className="card p-4">
          <p className="text-sm text-slate-500">สาขาปัจจุบัน</p>
          <p className="text-lg font-bold">{branchName}</p>
          <p className="mt-1 text-xs text-slate-500">เครื่อง: {deviceName}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-sm text-slate-500">ยอดล่าสุด</p>
            <p className="text-2xl font-bold text-orange">{total.toLocaleString()} ฿</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">กะ</p>
            <p className="text-lg font-bold">เปิดอยู่</p>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">บิลล่าสุด</h2>
          {orders?.length ? (
            orders.map((order) => (
              <p key={order.order_no} className="mt-2 flex justify-between text-sm">
                <span>{order.order_no}</span>
                <span>{Number(order.grand_total ?? order.total_amount ?? 0).toLocaleString()} ฿</span>
              </p>
            ))
          ) : (
            <p className="mt-2 text-sm text-slate-500">ยังไม่มีรายการ</p>
          )}
        </div>
        <div className="card p-4">
          <h2 className="font-bold">สต็อกต่ำ</h2>
          {lowStock?.length ? lowStock.map((item) => <p key={item.name} className="mt-2 text-sm">{item.name}: {item.quantity_on_hand} {item.base_unit}</p>) : <p className="mt-2 text-sm text-slate-500">ไม่มีรายการเตือน</p>}
        </div>
      </section>
    </MobileAppShell>
  );
}
