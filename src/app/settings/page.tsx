import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { CreditCard, LogOut, Monitor, Store, Users } from "lucide-react";

export default async function SettingsPage() {
  const { scope } = await requireOpenShift("settings:view");
  const supabase = createServiceClient();
  const [{ data: branch }, { data: device }, { count: usersCount }, { data: paymentAccounts }] = await Promise.all([
    supabase.from("branches").select("name,code").eq("id", scope.branchId).maybeSingle(),
    supabase.from("branch_devices").select("device_code,device_name,device_type,status,is_locked,last_seen_at").eq("id", scope.deviceId).maybeSingle(),
    supabase.from("user_branch_roles").select("user_id", { count: "exact", head: true }).eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId),
    supabase.from("payment_accounts").select("id,provider,account_name,is_active").eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId).limit(10),
  ]);

  const rows = [
    { icon: Store, label: "สาขา", value: `${branch?.name ?? "-"} (${branch?.code ?? "-"})` },
    { icon: Monitor, label: "เครื่อง", value: `${device?.device_name ?? scope.deviceName ?? scope.deviceCode} · ${device?.status ?? "active"}` },
    { icon: Users, label: "ผู้ใช้ในสาขา", value: `${usersCount ?? 0} คน` },
    { icon: CreditCard, label: "บัญชีรับชำระ", value: `${paymentAccounts?.filter((item) => item.is_active).length ?? 0} บัญชีที่เปิดใช้` },
    { icon: LogOut, label: "Session", value: scope.sessionId },
  ];

  return (
    <MobileAppShell title="ตั้งค่า" scope={scope}>
      <section className="grid gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <article key={label} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1677d9]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-[#587398]">{label}</p>
                <p className="m-0 mt-1 break-words text-sm font-bold text-[#0f2745]">{value}</p>
              </div>
            </div>
          </article>
        ))}
        <div className="card p-4 text-sm text-[#587398]">
          โครงตั้งค่าฝั่งมือถือผูกกับ branch/device/users/payment accounts แล้ว พร้อมต่อ UI ย่อยจากระบบ SSTiPOS
        </div>
      </section>
    </MobileAppShell>
  );
}
