import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";

function tableTone(status: string | null | undefined) {
  if (status === "available") return "border-[#cfe2f5] bg-white text-[#0f2745]";
  if (status === "occupied" || status === "ordering") return "border-[#ffd6a7] bg-[#fff8ed] text-[#9a5b00]";
  if (status === "pending_payment") return "border-[#bdebd0] bg-[#effdf5] text-[#0f8d46]";
  return "border-[#e4e7ec] bg-[#f8fafc] text-[#667085]";
}

function statusLabel(status: string | null | undefined) {
  if (status === "available") return "ว่าง";
  if (status === "occupied") return "มีลูกค้า";
  if (status === "ordering") return "กำลังสั่ง";
  if (status === "pending_payment") return "รอชำระ";
  if (status === "reserved") return "จอง";
  if (status === "disabled") return "ปิดใช้";
  return status ?? "-";
}

export default async function TableSalesPage() {
  const { scope } = await requireOpenShift("tables:view");
  const supabase = createServiceClient();
  const { data: tables } = await supabase
    .from("dining_tables")
    .select("id,table_code,table_name,capacity,status,is_active")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .eq("is_active", true)
    .order("table_code", { ascending: true })
    .limit(80);

  return (
    <MobileAppShell title="เลือกโต๊ะ" subtitle="เปิดโต๊ะลูกค้า" scope={scope}>
      <section className="grid grid-cols-2 gap-3">
        {(tables ?? []).length ? (
          (tables ?? []).map((table) => (
            <article key={table.id} className={`min-h-[124px] rounded-[20px] border p-4 shadow-sm ${tableTone(table.status)}`}>
              <p className="m-0 text-[13px] font-black opacity-75">โต๊ะ</p>
              <h2 className="m-0 mt-1 text-[24px] font-black leading-tight">{table.table_name ?? table.table_code}</h2>
              <p className="m-0 mt-3 text-[13px] font-bold">ที่นั่ง {table.capacity ?? 0} คน · {statusLabel(table.status)}</p>
            </article>
          ))
        ) : (
          <div className="card col-span-2 rounded-[18px] p-5 text-[15px] font-bold text-[#587398]">ยังไม่มีผังโต๊ะในสาขานี้</div>
        )}
      </section>
    </MobileAppShell>
  );
}
