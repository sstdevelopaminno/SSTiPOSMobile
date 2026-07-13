import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";

export default async function DeliverySalesPage() {
  const { scope } = await requireOpenShift(["owner", "manager", "staff"]);

  return (
    <MobileAppShell title="เดอรีเวอรี่" subtitle="เปิดออเดอร์ส่ง" scope={scope}>
      <section
        className="rounded-2xl border border-[#d9e8f7] bg-white p-4 shadow-sm"
        style={{ border: "1px solid #d9e8f7", borderRadius: 16, background: "#fff", padding: 16, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}
      />
    </MobileAppShell>
  );
}
