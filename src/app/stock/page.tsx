import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";

export default async function StockPage() {
  const { scope } = await requireOpenShift(["owner", "manager"]);
  return (
    <MobileAppShell title="จัดการสินค้า" scope={scope}>
      <div className="card p-4 text-sm text-slate-600">สรุปสินค้าและสต็อกต่ำแบบมือถือ</div>
    </MobileAppShell>
  );
}
