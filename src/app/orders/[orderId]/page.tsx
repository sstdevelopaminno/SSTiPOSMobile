import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { requireOpenShift } from "@/lib/permissions/guard";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderRow = {
  id: string;
  order_no: string;
  order_type: string | null;
  channel: string | null;
  status: string | null;
  subtotal: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  grand_total: number | null;
  tax_total: number | null;
  paid_total: number | null;
  cash_received: number | null;
  change_amount: number | null;
  customer_name: string | null;
  notes: string | null;
  created_at: string | null;
  payment_completed_at: string | null;
  metadata: Record<string, unknown> | null;
};

type OrderItemRow = {
  id: string;
  name: string | null;
  product_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  notes: string | null;
};

type PaymentRow = {
  id: string;
  method: string | null;
  amount: number | null;
  reference_no: string | null;
  status: string | null;
  received_at: string | null;
};

type ProductNameRow = {
  id: string;
  name: string | null;
};

type PageProps = {
  params: Promise<{ orderId: string }>;
};

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH");
}

function statusLabel(status: string | null | undefined) {
  if (status === "paid" || status === "completed") return "ชำระแล้ว";
  if (status === "draft") return "กำลังขาย";
  if (status === "held") return "พักบิล";
  if (status === "cancelled") return "ยกเลิก";
  return status ?? "-";
}

function orderTypeLabel(type: string | null | undefined) {
  if (type === "takeaway") return "กลับบ้าน";
  if (type === "dine_in") return "โต๊ะ";
  if (type === "delivery" || type === "delivery_manual") return "เดลิเวอรี่";
  return type ?? "order";
}

function paymentMethodLabel(method: string | null | undefined) {
  if (method === "cash") return "เงินสด";
  if (method === "bank_transfer" || method === "transfer") return "โอน";
  return method ?? "-";
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const { scope, shift } = await requireOpenShift("sales:list:view");
  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,order_no,order_type,channel,status,subtotal,discount_amount,total_amount,grand_total,tax_total,paid_total,cash_received,change_amount,customer_name,notes,created_at,payment_completed_at,metadata")
    .eq("id", orderId)
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .eq("shift_id", shift.id)
    .maybeSingle<OrderRow>();

  if (orderError) throw new Error(orderError.message);
  if (!order) notFound();

  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id,name,product_id,quantity,unit_price,line_total,notes")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("id,method,amount,reference_no,status,received_at")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("order_id", order.id)
      .order("received_at", { ascending: true }),
  ]);

  if (itemsError) throw new Error(itemsError.message);
  if (paymentsError) throw new Error(paymentsError.message);

  const itemRows = (items ?? []) as OrderItemRow[];
  const productIds = itemRows.map((item) => item.product_id).filter((id): id is string => Boolean(id));
  const { data: productRows } = productIds.length
    ? await supabase
      .from("products")
      .select("id,name")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .in("id", productIds)
    : { data: [] };
  const productNames = new Map(((productRows ?? []) as ProductNameRow[]).map((product) => [product.id, product.name]));
  const paymentRows = (payments ?? []) as PaymentRow[];
  const paymentTotal = paymentRows.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  return (
    <MobileAppShell title="รายละเอียดบิล" scope={scope}>
      <section className="grid gap-3">
        <Link href="/orders" className="inline-flex min-h-10 w-fit items-center rounded-[12px] border border-[#d9e8f7] bg-white px-4 text-[13px] font-black text-[#17416f] no-underline">
          กลับรายการขาย
        </Link>

        <article className="card rounded-[18px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-black text-[#587398]">{orderTypeLabel(order.order_type)} / {order.channel ?? "-"}</p>
              <h1 className="m-0 mt-1 truncate text-[24px] font-black text-[#0f2745]">{order.order_no}</h1>
              <p className="m-0 mt-1 text-[12px] font-bold text-[#7a8fa8]">{formatDate(order.created_at)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#eef6ff] px-3 py-1 text-[12px] font-black text-[#17416f]">{statusLabel(order.status)}</span>
          </div>
          {order.customer_name ? <p className="m-0 mt-3 text-[13px] font-bold text-[#587398]">ลูกค้า: {order.customer_name}</p> : null}
          {order.notes ? <p className="m-0 mt-2 rounded-[12px] bg-[#f8fbff] p-3 text-[13px] font-bold text-[#587398]">{order.notes}</p> : null}
        </article>

        <article className="card rounded-[18px] p-4">
          <h2 className="m-0 text-[18px] font-black text-[#0f2745]">รายการสินค้า</h2>
          <div className="mt-3 grid gap-2">
            {itemRows.length ? itemRows.map((item) => {
              const itemName = item.name || (item.product_id ? productNames.get(item.product_id) : null) || "-";
              return (
                <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-[14px] bg-[#f8fbff] p-3">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-black text-[#0f2745]">{itemName}</p>
                    <p className="m-0 mt-1 text-[12px] font-bold text-[#7a8fa8]">x {Number(item.quantity ?? 0).toLocaleString("th-TH")} @ ฿{money(item.unit_price)}</p>
                    {item.notes ? <p className="m-0 mt-1 text-[12px] font-bold text-[#d97706]">{item.notes}</p> : null}
                  </div>
                  <b className="text-[14px] text-[#1677d9]">฿{money(item.line_total)}</b>
                </div>
              );
            }) : (
              <p className="m-0 text-[13px] font-bold text-[#7a8fa8]">ไม่มีรายการสินค้าในบิลนี้</p>
            )}
          </div>
        </article>

        <article className="card rounded-[18px] p-4">
          <h2 className="m-0 text-[18px] font-black text-[#0f2745]">สรุปยอด</h2>
          <div className="mt-3 grid gap-2 text-[14px] font-bold text-[#334155]">
            <div className="flex justify-between gap-3"><span>ยอดก่อนลด</span><b>฿{money(order.subtotal ?? order.total_amount)}</b></div>
            <div className="flex justify-between gap-3"><span>ส่วนลด</span><b>- ฿{money(order.discount_amount)}</b></div>
            <div className="flex justify-between gap-3"><span>ภาษี</span><b>฿{money(order.tax_total)}</b></div>
            <div className="flex justify-between gap-3 border-t border-dashed border-[#c9dbf2] pt-2 text-[17px] text-[#0f2745]"><span>ยอดสุทธิ</span><b>฿{money(order.grand_total ?? order.total_amount)}</b></div>
            <div className="flex justify-between gap-3"><span>รับชำระแล้ว</span><b>฿{money(order.paid_total ?? paymentTotal)}</b></div>
            {order.cash_received !== null ? <div className="flex justify-between gap-3"><span>รับเงินสด</span><b>฿{money(order.cash_received)}</b></div> : null}
            {order.change_amount !== null ? <div className="flex justify-between gap-3"><span>เงินทอน</span><b>฿{money(order.change_amount)}</b></div> : null}
          </div>
        </article>

        <article className="card rounded-[18px] p-4">
          <h2 className="m-0 text-[18px] font-black text-[#0f2745]">การชำระเงิน</h2>
          <div className="mt-3 grid gap-2">
            {paymentRows.length ? paymentRows.map((payment) => (
              <div key={payment.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-[14px] bg-[#f8fbff] p-3">
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-black text-[#0f2745]">{paymentMethodLabel(payment.method)}</p>
                  <p className="m-0 mt-1 text-[12px] font-bold text-[#7a8fa8]">{formatDate(payment.received_at)} / {payment.status ?? "-"}</p>
                  {payment.reference_no ? <p className="m-0 mt-1 text-[12px] font-bold text-[#587398]">อ้างอิง: {payment.reference_no}</p> : null}
                </div>
                <b className="text-[14px] text-[#1677d9]">฿{money(payment.amount)}</b>
              </div>
            )) : (
              <p className="m-0 text-[13px] font-bold text-[#7a8fa8]">ยังไม่มีรายการชำระเงิน</p>
            )}
          </div>
        </article>

        {order.payment_completed_at ? (
          <p className="m-0 pb-4 text-center text-[12px] font-bold text-[#7a8fa8]">ชำระเสร็จเมื่อ {formatDate(order.payment_completed_at)}</p>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
