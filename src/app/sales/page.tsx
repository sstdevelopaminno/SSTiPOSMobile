import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { ScanLine, ShoppingCart } from "lucide-react";

export default async function SalesPage() {
  const { scope } = await requireOpenShift(["owner", "manager", "staff"]);
  return (
    <MobileAppShell title="ขาย" scope={scope}>
      <section className="space-y-3">
        <div className="rounded-xl border border-[#c9dbf2] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1677d9]">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#0f2745]">พร้อมขาย</h2>
              <p className="mt-1 text-sm text-[#587398]">พื้นที่ขายแบบมือถือ รอออกแบบสินค้า ตะกร้า และการชำระเงิน</p>
            </div>
          </div>
        </div>
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[#b9d3f2] bg-[#f7fbff] p-6 text-center">
          <div>
            <ScanLine className="mx-auto h-10 w-10 text-[#7fa8d8]" />
            <p className="mt-3 text-sm font-semibold text-[#17416f]">หน้า POS มือถือเบื้องต้น</p>
            <p className="mt-1 text-xs text-[#587398]">เว้นพื้นที่ไว้สำหรับออกแบบเมนูขายในขั้นถัดไป</p>
          </div>
        </div>
      </section>
    </MobileAppShell>
  );
}
