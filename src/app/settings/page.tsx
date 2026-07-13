import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";

export default async function SettingsPage() {
  const { scope } = await requireOpenShift(["owner", "manager"]);
  return (
    <MobileAppShell title="ตั้งค่า" scope={scope}>
      <div className="card p-4 text-sm text-slate-600">ข้อมูลเครื่อง, logout, sync และ audit</div>
    </MobileAppShell>
  );
}
