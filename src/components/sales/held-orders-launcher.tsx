"use client";

import { LoadingDialog } from "@/components/auth/loading-dialog";
import { ClipboardList, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type HeldOrder = {
  id: string;
  orderNo: string;
  total: number;
  discount: number;
  itemCount: number;
  updatedAt: string | null;
  items: Array<{
    name: string;
    quantity: number;
    lineTotal: number;
  }>;
};

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeSixDigitPin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function PinDigits({ value }: { value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} style={{ display: "grid", minHeight: 44, placeItems: "center", border: "1px solid #ffd7d7", borderRadius: 10, background: "#fff", color: "#0f2745", fontSize: 18, fontWeight: 950 }}>
          {value[index] ? "*" : ""}
        </span>
      ))}
    </div>
  );
}

export function HeldOrdersLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<HeldOrder | null>(null);
  const [cancelPin, setCancelPin] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");

  async function loadHeldOrders() {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/held", { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setError(json?.error?.message ?? "โหลดรายการพักไม่สำเร็จ");
        return;
      }
      setOrders(json?.data?.orders ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function restoreHeldOrder(orderId: string) {
    if (restoringId || cancelLoading) return;
    setRestoringId(orderId);
    setError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/held/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setError(json?.error?.message ?? "เรียกบิลพักไม่สำเร็จ");
        return;
      }
      setOpen(false);
      router.push("/sales/takeaway");
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  }

  async function cancelHeldOrder() {
    if (!cancelTarget || cancelPin.length !== 6 || cancelLoading) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: cancelTarget.id, pin: cancelPin }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setCancelError(json?.error?.message ?? "ยกเลิกบิลไม่สำเร็จ");
        return;
      }
      setOrders((current) => current.filter((order) => order.id !== cancelTarget.id));
      setCancelTarget(null);
      setCancelPin("");
      router.refresh();
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={loadHeldOrders}
        className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-[#d9e8f7] bg-white px-4 text-sm font-black text-[#17416f] shadow-sm transition active:scale-[0.99] active:bg-[#f5faff]"
      >
        <ClipboardList className="h-5 w-5 text-[#1677d9]" />
        รายการพัก
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label="รายการพัก" style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(94vw, 430px)", maxHeight: "min(76vh, 620px)", overflowY: "auto", border: "1px solid #d9e8f7", borderRadius: 18, background: "#f8fbff", padding: 14, boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f2745", fontSize: 17, fontWeight: 950 }}>รายการพัก</h2>
                <p style={{ margin: "2px 0 0", color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>{orders.length} รายการ</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="ปิด" style={{ display: "flex", width: 38, height: 38, minHeight: 38, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <X size={18} />
              </button>
            </header>

            {error ? <div style={{ border: "1px solid #ffd7d7", borderRadius: 14, background: "#fff8f8", padding: 12, color: "#d62929", fontSize: 12, fontWeight: 800 }}>{error}</div> : null}
            {loading ? <div style={{ padding: 18, textAlign: "center", color: "#587398", fontSize: 13, fontWeight: 900 }}>กำลังโหลด...</div> : null}
            {!loading && !orders.length && !error ? <div style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 16, color: "#7a8fa8", fontSize: 13, fontWeight: 800, textAlign: "center" }}>ยังไม่มีบิลที่พัก</div> : null}

            <div style={{ display: "grid", gap: 10 }}>
              {orders.map((order) => (
                <article key={order.id} style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <b style={{ color: "#0f2745", fontSize: 13 }}>{order.orderNo}</b>
                      <p style={{ margin: "2px 0 0", color: "#7a8fa8", fontSize: 11 }}>{order.updatedAt ? new Date(order.updatedAt).toLocaleString("th-TH") : "-"}</p>
                    </div>
                    <b style={{ color: "#1677d9", fontSize: 14 }}>฿{money(order.total)}</b>
                  </div>
                  <p style={{ margin: "8px 0 0", color: "#587398", fontSize: 12, fontWeight: 800 }}>{order.itemCount} รายการ</p>
                  <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={`${order.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, color: "#334155", fontSize: 11 }}>
                        <span>{item.name} x {item.quantity}</span>
                        <b>฿{money(item.lineTotal)}</b>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 46px", gap: 8, marginTop: 10 }}>
                    <button type="button" onClick={() => restoreHeldOrder(order.id)} disabled={Boolean(restoringId) || cancelLoading} style={{ width: "100%", minHeight: 40, border: 0, borderRadius: 12, background: "#1677d9", color: "#fff", fontSize: 12, fontWeight: 950 }}>
                      {restoringId === order.id ? "กำลังเรียก..." : "เรียกกลับ"}
                    </button>
                    <button type="button" onClick={() => { setCancelTarget(order); setCancelPin(""); setCancelError(""); }} disabled={Boolean(restoringId) || cancelLoading} aria-label="ยกเลิกบิล" style={{ display: "flex", minHeight: 40, alignItems: "center", justifyContent: "center", border: "1px solid #fecaca", borderRadius: 12, background: "#fff1f1", color: "#d62929" }}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {cancelTarget ? (
        <div role="dialog" aria-modal="true" aria-label="ยกเลิกบิลพัก" style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(92vw, 380px)", border: "1px solid #ffd7d7", borderRadius: 18, background: "#fff", padding: 14, boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 style={{ margin: 0, color: "#d62929", fontSize: 16, fontWeight: 900 }}>ยกเลิกบิลพัก</h2>
              <button type="button" onClick={() => setCancelTarget(null)} aria-label="ปิด" style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: "1px solid #ffd7d7", borderRadius: 999, background: "#fff", color: "#d62929" }}>
                <X size={17} />
              </button>
            </header>
            <p style={{ margin: "8px 0 0", color: "#7a8fa8", fontSize: 12, fontWeight: 700 }}>{cancelTarget.orderNo}</p>
            <label style={{ display: "grid", gap: 6, marginTop: 12, color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>
              ใส่ PIN ผู้มีสิทธิ์
              <input id="held-cancel-pin" value={cancelPin} onChange={(event) => setCancelPin(normalizeSixDigitPin(event.target.value))} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
              <button type="button" onClick={() => document.getElementById("held-cancel-pin")?.focus()} style={{ border: 0, background: "transparent", padding: 0, textAlign: "initial" }}>
                <PinDigits value={cancelPin} />
              </button>
            </label>
            {cancelError ? <p style={{ margin: "8px 0 0", color: "#d62929", fontSize: 12, fontWeight: 800 }}>{cancelError}</p> : null}
            <button type="button" onClick={cancelHeldOrder} disabled={cancelPin.length !== 6 || cancelLoading} style={{ width: "100%", minHeight: 46, marginTop: 12, border: 0, borderRadius: 13, background: cancelPin.length !== 6 || cancelLoading ? "#f2a6a6" : "#d62929", color: "#fff", fontSize: 14, fontWeight: 900 }}>
              {cancelLoading ? "กำลังยกเลิก..." : "ยืนยันยกเลิกบิล"}
            </button>
          </section>
        </div>
      ) : null}

      <LoadingDialog open={Boolean(restoringId)} title="กำลังเรียกบิลพัก" message="กำลังเปิดบิลกลับสู่หน้าแคชเชียร์..." />
      <LoadingDialog open={cancelLoading} title="กำลังยกเลิกบิล" message="กำลังตรวจ PIN และยกเลิกบิลพัก..." />
    </>
  );
}
