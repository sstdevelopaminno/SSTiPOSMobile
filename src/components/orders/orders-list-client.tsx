"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type MobileOrderListItem = {
  id: string;
  orderNo: string;
  orderType: string | null;
  status: string | null;
  total: number;
  createdAt: string | null;
};

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "completed", label: "ชำระแล้ว" },
  { key: "draft", label: "กำลังขาย" },
  { key: "cancelled", label: "ยกเลิก" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function matchesFilter(order: MobileOrderListItem, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "completed") return order.status === "completed" || order.status === "paid";
  return order.status === filter;
}

export function OrdersListClient({ orders }: { orders: MobileOrderListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) return false;
      if (!search) return true;
      const haystack = [
        order.orderNo,
        orderTypeLabel(order.orderType),
        statusLabel(order.status),
        money(order.total),
        order.createdAt ? new Date(order.createdAt).toLocaleString("th-TH") : "",
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }, [filter, orders, query]);

  return (
    <section className="grid gap-3">
      <div className="card rounded-[18px] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-[12px] font-black text-[#587398]">ค้นหาบิล</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-[#9aaac0]">{filteredOrders.length} / {orders.length} รายการ</p>
          </div>
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="min-h-9 rounded-[10px] border border-[#d9e8f7] bg-white px-3 text-[12px] font-black text-[#17416f]">
              ล้าง
            </button>
          ) : null}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาเลขบิล / สถานะ / ยอดเงิน"
          className="mt-3 h-11 w-full rounded-[12px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[14px] font-bold text-[#0f2745] outline-none placeholder:text-[#9aaac0]"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`min-h-9 shrink-0 rounded-full px-4 text-[12px] font-black ${filter === item.key ? "bg-[#1677d9] text-white" : "border border-[#d9e8f7] bg-white text-[#17416f]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length ? (
        filteredOrders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card block rounded-[18px] p-4 no-underline">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-bold text-[#7a8fa8]">{orderTypeLabel(order.orderType)}</p>
                <h2 className="m-0 mt-1 truncate text-[18px] font-black text-[#0f2745]">{order.orderNo}</h2>
                <p className="m-0 mt-1 text-[13px] font-semibold text-[#7a8fa8]">{order.createdAt ? new Date(order.createdAt).toLocaleString("th-TH") : "-"}</p>
                <p className="m-0 mt-2 text-[12px] font-black text-[#1677d9]">แตะเพื่อดูรายละเอียด</p>
              </div>
              <div className="shrink-0 text-right">
                <b className="block text-[18px] text-[#1677d9]">{money(order.total)} ฿</b>
                <span className="mt-2 inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[12px] font-black text-[#17416f]">{statusLabel(order.status)}</span>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="card rounded-[18px] p-5 text-[15px] font-bold text-[#587398]">ไม่พบบิลที่ตรงกับคำค้นหา</div>
      )}
    </section>
  );
}
