import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { ShiftActions } from "@/components/shifts/shift-actions";
import { requireMobileSession } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { Clock, Monitor, Store } from "lucide-react";

export default async function ShiftsPage() {
  const scope = await requireMobileSession(["owner", "manager", "staff"]);
  const supabase = createServiceClient();
  const [{ data: branch }, { data: shift }] = await Promise.all([
    supabase.from("branches").select("name,code").eq("id", scope.branchId).maybeSingle(),
    supabase.from("shifts").select("id,status,opened_at,closed_at,device_code").eq("tenant_id", scope.tenantId).eq("branch_id", scope.branchId).eq("device_code", scope.deviceCode).eq("status", "open").maybeSingle()
  ]);

  return (
    <MobileAppShell title="ปิดยอด" scope={scope} showBottomNav={Boolean(shift)}>
      <section className="space-y-4">
        <div className="card p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1677d9]">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#0f2745]">{shift ? "กะเปิดอยู่" : "ยังไม่เปิดกะ"}</h2>
              <p className="mt-1 text-sm text-[#587398]">เปิดกะของเครื่องนี้ก่อนเริ่มขาย และปิดยอดเมื่อจบงาน</p>
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            <p className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#1677d9]" />
              <span>สาขา: <b>{String(branch?.name ?? branch?.code ?? "-")}</b></span>
            </p>
            <p className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#1677d9]" />
              <span>เครื่องแคชเชียร์: <b>{scope.deviceName ?? scope.deviceCode}</b></span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1677d9]" />
              <span>เวลาเปิด: <b>{shift?.opened_at ? new Date(shift.opened_at).toLocaleString("th-TH") : "-"}</b></span>
            </p>
          </div>
        </div>
        <ShiftActions hasOpenShift={Boolean(shift)} />
      </section>
    </MobileAppShell>
  );
}
