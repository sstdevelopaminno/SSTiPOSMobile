import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";

export default async function OrdersPage() {
  const { scope } = await requireOpenShift(["owner", "manager", "staff", "accountant"]);
  return (
    <MobileAppShell title="รายการขาย" scope={scope}>
      <div className="card p-4 text-sm text-slate-600">รายการขายล่าสุดจะแสดงจาก tenant/branch/device scope</div>
    </MobileAppShell>
  );
}
