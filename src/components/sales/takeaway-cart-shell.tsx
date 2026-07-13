"use client";

import { Banknote, ChevronLeft, ChevronRight, Landmark, Minus, Percent, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type TakeawayCategory = {
  id: string;
  name: string;
};

export type TakeawayProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number;
  sellUnit: string | null;
};

type CartLine = TakeawayProduct & {
  quantity: number;
};

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
    unitPrice: number;
    lineTotal: number;
  }>;
};

const PAGE_SIZE = 5;
const BAHT = "\u0e3f";
const LABELS = {
  all: "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  takeaway: "\u0e01\u0e25\u0e31\u0e1a\u0e1a\u0e49\u0e32\u0e19",
  itemCount: "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23",
  amount: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e40\u0e07\u0e34\u0e19",
  billNo: "\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48\u0e1a\u0e34\u0e25",
  back: "\u0e01\u0e25\u0e31\u0e1a",
  member: "\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01",
  addProduct: "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32",
  added: "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e41\u0e25\u0e49\u0e27",
  discount: "\u0e2a\u0e48\u0e27\u0e19\u0e25\u0e14",
  cancelBill: "\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01\u0e1a\u0e34\u0e25",
  holdBill: "\u0e1e\u0e31\u0e01\u0e1a\u0e34\u0e25",
  heldOrders: "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e1e\u0e31\u0e01",
  noHeldOrders: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1a\u0e34\u0e25\u0e17\u0e35\u0e48\u0e1e\u0e31\u0e01",
  pay: "\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19",
  cash: "\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e14",
  transfer: "\u0e40\u0e07\u0e34\u0e19\u0e42\u0e2d\u0e19",
  choosePayment: "\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e34\u0e18\u0e35\u0e0a\u0e33\u0e23\u0e30",
  discountType: "\u0e23\u0e39\u0e1b\u0e41\u0e1a\u0e1a\u0e2a\u0e48\u0e27\u0e19\u0e25\u0e14",
  percent: "\u0e40\u0e1b\u0e2d\u0e23\u0e4c\u0e40\u0e0b\u0e47\u0e19\u0e15\u0e4c",
  amountValue: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e40\u0e07\u0e34\u0e19",
  apply: "\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19",
  subtotal: "\u0e22\u0e2d\u0e14\u0e01\u0e48\u0e2d\u0e19\u0e25\u0e14",
  totalAfterDiscount: "\u0e2b\u0e25\u0e31\u0e07\u0e2b\u0e31\u0e01\u0e2a\u0e48\u0e27\u0e19\u0e25\u0e14",
  enterPin: "\u0e43\u0e2a\u0e48 PIN",
  cart: "\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32",
  clearAll: "\u0e25\u0e49\u0e32\u0e07\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  emptyCart: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e43\u0e19\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32",
  previous: "\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32",
  next: "\u0e16\u0e31\u0e14\u0e44\u0e1b",
  chooseProduct: "\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32",
  close: "\u0e1b\u0e34\u0e14",
  deleteItem: "\u0e25\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23",
  noProducts: "\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e43\u0e19\u0e2b\u0e21\u0e27\u0e14\u0e19\u0e35\u0e49",
};

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TakeawayCartShell({ categories, products, orderId, orderNo }: { categories: TakeawayCategory[]; products: TakeawayProduct[]; orderId: string; orderNo: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [page, setPage] = useState(0);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [heldListOpen, setHeldListOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [heldLoading, setHeldLoading] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);
  const [heldError, setHeldError] = useState("");
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountInput, setDiscountInput] = useState("");
  const [holdPin, setHoldPin] = useState("");
  const [holdError, setHoldError] = useState("");
  const [holdLoading, setHoldLoading] = useState(false);
  const [addedNotice, setAddedNotice] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name ?? LABELS.all);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);
  const addedNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedNoticeTimerRef.current) window.clearTimeout(addedNoticeTimerRef.current);
    };
  }, []);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => activeCategory === LABELS.all || product.category === activeCategory);
  }, [activeCategory, products]);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const rawDiscountValue = Math.max(0, Number(discountInput || 0));
  const discountAmount = discountMode === "percent" ? Math.min(subtotalAmount, subtotalAmount * Math.min(rawDiscountValue, 100) / 100) : Math.min(subtotalAmount, rawDiscountValue);
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const pageCount = Math.max(1, Math.ceil(cart.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleCart = useMemo(() => cart.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE), [cart, currentPage]);

  function addProduct(product: TakeawayProduct) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setAddedNotice(product.name);
    if (addedNoticeTimerRef.current) window.clearTimeout(addedNoticeTimerRef.current);
    addedNoticeTimerRef.current = window.setTimeout(() => setAddedNotice(""), 1200);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const next = current
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);
      const nextPageCount = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage((value) => Math.min(value, nextPageCount - 1));
      return next;
    });
  }

  function removeProduct(productId: string) {
    setCart((current) => {
      const next = current.filter((item) => item.id !== productId);
      const nextPageCount = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage((value) => Math.min(value, nextPageCount - 1));
      return next;
    });
  }

  function clearCart() {
    setCart([]);
    setPage(0);
  }

  function scrollCategories(direction: "left" | "right") {
    categoryScrollerRef.current?.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }

  async function cancelBill() {
    setHoldLoading(true);
    setHoldError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, pin: holdPin }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setHoldError(json?.error?.message ?? "Hold failed");
        return;
      }
      router.push(json?.data?.redirectTo ?? "/sales");
      router.refresh();
    } finally {
      setHoldLoading(false);
    }
  }

  async function holdCurrentBill() {
    if (!cart.length || holdSubmitting) return;
    setHoldSubmitting(true);
    setHeldError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/hold", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          discountMode,
          discountValue: rawDiscountValue,
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setHeldError(json?.error?.message ?? "Hold failed");
        return;
      }
      setCart([]);
      setDiscountInput("");
      setPage(0);
      router.refresh();
    } finally {
      setHoldSubmitting(false);
    }
  }

  async function openHeldOrders() {
    setHeldListOpen(true);
    setHeldLoading(true);
    setHeldError("");
    try {
      const response = await fetch("/api/mobile/sales/takeaway/held", { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.error) {
        setHeldError(json?.error?.message ?? "Load held orders failed");
        return;
      }
      setHeldOrders(json?.data?.orders ?? []);
    } finally {
      setHeldLoading(false);
    }
  }

  return (
    <section aria-label={LABELS.takeaway} style={{ position: "relative", zIndex: 1, display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gap: 12,
          border: "1px solid #cfe2f5",
          borderRadius: 16,
          background: "#fff",
          padding: 12,
          boxShadow: "0 8px 22px rgba(15,39,69,0.08)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: "#7a8fa8", fontSize: 10, fontWeight: 800 }}>{LABELS.billNo}</p>
            <strong style={{ display: "block", marginTop: 2, overflow: "hidden", color: "#0f2745", fontSize: 13, fontWeight: 900, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {orderNo}
            </strong>
          </div>
          <button type="button" style={{ display: "inline-flex", minHeight: 34, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f", padding: "0 10px", fontSize: 12, fontWeight: 900, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}>
            {LABELS.member}
          </button>
          <Link href="/sales" style={{ display: "inline-flex", minHeight: 34, alignItems: "center", justifyContent: "center", gap: 3, border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f", padding: "0 11px", fontSize: 12, fontWeight: 900, textDecoration: "none", boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}>
            <ChevronLeft size={14} />
            {LABELS.back}
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: "1px solid #eef4fb", paddingTop: 12 }}>
          <div>
            <p style={{ margin: 0, color: "#7a8fa8", fontSize: 11, fontWeight: 700 }}>{LABELS.itemCount}</p>
            <strong style={{ display: "block", marginTop: 4, color: "#0f2745", fontSize: 24, lineHeight: 1 }}>{totalQuantity}</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#7a8fa8", fontSize: 11, fontWeight: 700 }}>{LABELS.amount}</p>
            <strong style={{ display: "block", marginTop: 4, color: "#1677d9", fontSize: 24, lineHeight: 1 }}>{money(totalAmount)} {BAHT}</strong>
          </div>
        </div>

        {discountAmount > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, borderTop: "1px solid #eef4fb", paddingTop: 10 }}>
            <span style={{ color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>{LABELS.subtotal}</span>
            <b style={{ color: "#17416f", fontSize: 12 }}>{money(subtotalAmount)} {BAHT}</b>
            <span style={{ color: "#d62929", fontSize: 11, fontWeight: 800 }}>{LABELS.discount}</span>
            <b style={{ color: "#d62929", fontSize: 12 }}>- {money(discountAmount)} {BAHT}</b>
            <span style={{ color: "#1677d9", fontSize: 12, fontWeight: 900 }}>{LABELS.totalAfterDiscount}</span>
            <b style={{ color: "#1677d9", fontSize: 14 }}>{money(totalAmount)} {BAHT}</b>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", gap: 8, borderTop: "1px solid #eef4fb", paddingTop: 12 }}>
          <button type="button" onClick={() => setProductPickerOpen(true)} style={{ position: "relative", zIndex: 2, display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", gap: 6, border: 0, borderRadius: 13, background: "#1677d9", color: "#fff", fontSize: 12, fontWeight: 900, pointerEvents: "auto" }}>
            <Plus size={18} />
            {LABELS.addProduct}
          </button>
          <button type="button" onClick={() => setDiscountOpen(true)} style={{ display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid #d9e8f7", borderRadius: 13, background: "#fff", color: "#17416f", fontSize: 12, fontWeight: 900 }}>
            <Percent size={16} />
            {LABELS.discount}
          </button>
          <button type="button" onClick={openHeldOrders} disabled={heldLoading} style={{ display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 13, background: "#fff", color: "#17416f", fontSize: 12, fontWeight: 900 }}>
            {heldLoading ? "..." : LABELS.heldOrders}
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #d9e8f7", borderRadius: 16, background: "#fff", padding: 12, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 48px", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, color: "#0f2745", fontSize: 14, fontWeight: 900 }}>{LABELS.cart}</h2>
          {cart.length ? (
            <button type="button" onClick={clearCart} style={{ minHeight: 30, border: "1px solid #ffd7d7", borderRadius: 999, background: "#fff8f8", color: "#d62929", padding: "0 10px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap" }}>
              {LABELS.clearAll}
            </button>
          ) : (
            <span />
          )}
          <span style={{ color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>
            {cart.length ? `${currentPage + 1}/${pageCount}` : `0 ${LABELS.itemCount}`}
          </span>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {visibleCart.map((item) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 76px 72px 28px", gap: 8, alignItems: "center", borderRadius: 12, background: "#f7fbff", padding: 10 }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#0f2745", fontSize: 12 }}>{item.name}</strong>
                <span style={{ color: "#7a8fa8", fontSize: 10 }}>{money(item.price)} {BAHT}</span>
              </div>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <button type="button" onClick={() => updateQuantity(item.id, -1)} style={{ display: "flex", width: 24, height: 24, minHeight: 24, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 8, background: "#fff" }}>
                  <Minus size={12} />
                </button>
                <b style={{ minWidth: 16, color: "#0f2745", fontSize: 12, textAlign: "center" }}>{item.quantity}</b>
                <button type="button" onClick={() => updateQuantity(item.id, 1)} style={{ display: "flex", width: 24, height: 24, minHeight: 24, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 8, background: "#fff" }}>
                  <Plus size={12} />
                </button>
              </span>
              <span style={{ color: "#1677d9", fontSize: 12, fontWeight: 900, textAlign: "right" }}>{money(item.quantity * item.price)} {BAHT}</span>
              <button type="button" onClick={() => removeProduct(item.id)} aria-label={LABELS.deleteItem} title={LABELS.deleteItem} style={{ display: "flex", width: 28, height: 28, minHeight: 28, alignItems: "center", justifyContent: "center", border: "1px solid #ffd7d7", borderRadius: 9, background: "#fff", color: "#d62929" }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {cart.length === 0 ? (
            <div style={{ display: "grid", justifyItems: "center", padding: "20px 12px", color: "#7a8fa8", textAlign: "center" }}>
              <Image src="/brand/cpipos-logo.png" alt="CpIPOS" width={148} height={102} style={{ width: 148, maxWidth: "62%", height: "auto", objectFit: "contain" }} />
            </div>
          ) : null}
        </div>

        {cart.length > PAGE_SIZE ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 12 }}>
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} style={{ display: "flex", minHeight: 34, alignItems: "center", gap: 4, border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: currentPage === 0 ? "#aac0d6" : "#17416f", padding: "0 10px", fontSize: 12, fontWeight: 800 }}>
              <ChevronLeft size={14} /> {LABELS.previous}
            </button>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} style={{ display: "flex", minHeight: 34, alignItems: "center", gap: 4, border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: currentPage >= pageCount - 1 ? "#aac0d6" : "#17416f", padding: "0 10px", fontSize: 12, fontWeight: 800 }}>
              {LABELS.next} <ChevronRight size={14} />
            </button>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 0.9fr 1.35fr", gap: 7, marginTop: 12, borderTop: "1px solid #eef4fb", paddingTop: 12 }}>
          <button type="button" onClick={() => setHoldOpen(true)} style={{ display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", border: "1px solid #ffd7d7", borderRadius: 13, background: "#fff8f8", color: "#d62929", fontSize: 12, fontWeight: 900 }}>
            {LABELS.cancelBill}
          </button>
          <button type="button" onClick={holdCurrentBill} disabled={!cart.length || holdSubmitting} style={{ display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", border: "1px solid #ffdca8", borderRadius: 13, background: !cart.length || holdSubmitting ? "#fff4e1" : "#fffaf2", color: !cart.length || holdSubmitting ? "#d6a96f" : "#b65f00", fontSize: 12, fontWeight: 900 }}>
            {holdSubmitting ? "..." : LABELS.holdBill}
          </button>
          <button type="button" onClick={() => setPaymentOpen(true)} disabled={!cart.length} style={{ display: "flex", minHeight: 44, alignItems: "center", justifyContent: "center", border: 0, borderRadius: 13, background: totalQuantity ? "#1677d9" : "#a8cdf2", color: "#fff", fontSize: 12, fontWeight: 900 }}>
            {LABELS.pay} {money(totalAmount)} {BAHT}
          </button>
        </div>
      </div>

      {productPickerOpen ? (
        <div role="dialog" aria-modal="true" aria-label={LABELS.chooseProduct} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: "16px 10px max(16px, env(safe-area-inset-bottom))" }}>
          <section style={{ width: "min(96vw, 462px)", maxHeight: "90dvh", overflow: "hidden", border: "1px solid #d9e8f7", borderRadius: 20, background: "#f5f8fb", boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: "1px solid #d9e8f7", background: "#fff", padding: 14 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 900 }}>{LABELS.chooseProduct}</h2>
                <p style={{ margin: "2px 0 0", color: "#7a8fa8", fontSize: 11 }}>{products.length} {LABELS.itemCount}</p>
              </div>
              {addedNotice ? (
                <div style={{ maxWidth: 140, overflow: "hidden", border: "1px solid #bcefd0", borderRadius: 999, background: "#e9fff1", color: "#0f8d46", padding: "7px 10px", fontSize: 11, fontWeight: 900, textOverflow: "ellipsis", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(15,141,70,0.16)", animation: "fadeAddedNotice 1.2s ease forwards" }}>
                  {LABELS.added}
                </div>
              ) : null}
              <button type="button" onClick={() => setProductPickerOpen(false)} aria-label={LABELS.close} style={{ display: "flex", width: 36, height: 36, minHeight: 36, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <X size={18} />
              </button>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 1fr) 32px", gap: 6, alignItems: "center", padding: "12px 12px 8px" }}>
              <button type="button" onClick={() => scrollCategories("left")} aria-label={LABELS.previous} style={{ display: "flex", width: 32, height: 32, minHeight: 32, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <ChevronLeft size={16} />
              </button>
              <div ref={categoryScrollerRef} style={{ display: "flex", gap: 8, overflowX: "auto", scrollBehavior: "smooth", scrollbarWidth: "none" }}>
                {categories.map((category) => {
                  const active = category.name === activeCategory;
                  return (
                    <button key={category.id} type="button" onClick={() => setActiveCategory(category.name)} style={{ minHeight: 36, flex: "0 0 auto", border: `1px solid ${active ? "#1677d9" : "#d9e8f7"}`, borderRadius: 999, background: active ? "#1677d9" : "#fff", color: active ? "#fff" : "#17416f", padding: "0 14px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => scrollCategories("right")} aria-label={LABELS.next} style={{ display: "flex", width: 32, height: 32, minHeight: 32, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ maxHeight: "calc(90dvh - 116px)", overflowY: "auto", padding: "4px 12px 14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {visibleProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => addProduct(product)} style={{ minHeight: 118, border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 12, textAlign: "left", boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}>
                    <strong style={{ display: "block", minHeight: 34, color: "#0f2745", fontSize: 13, fontWeight: 900, lineHeight: 1.25 }}>{product.name}</strong>
                    <span style={{ display: "block", marginTop: 6, color: "#7a8fa8", fontSize: 10, lineHeight: 1.25 }}>{product.sku ?? product.category}</span>
                    <span style={{ display: "block", marginTop: 10, color: "#1677d9", fontSize: 15, fontWeight: 900 }}>{money(product.price)} {BAHT}</span>
                  </button>
                ))}
              </div>

              {visibleProducts.length === 0 ? (
                <div style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 16, color: "#7a8fa8", fontSize: 13, textAlign: "center" }}>
                  {LABELS.noProducts}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {discountOpen ? (
        <div role="dialog" aria-modal="true" aria-label={LABELS.discount} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(92vw, 390px)", border: "1px solid #d9e8f7", borderRadius: 18, background: "#fff", padding: 14, boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 900 }}>{LABELS.discount}</h2>
              <button type="button" onClick={() => setDiscountOpen(false)} aria-label={LABELS.close} style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <X size={17} />
              </button>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setDiscountMode("percent")} style={{ minHeight: 42, border: `1px solid ${discountMode === "percent" ? "#1677d9" : "#d9e8f7"}`, borderRadius: 12, background: discountMode === "percent" ? "#1677d9" : "#fff", color: discountMode === "percent" ? "#fff" : "#17416f", fontSize: 13, fontWeight: 900 }}>{LABELS.percent}</button>
              <button type="button" onClick={() => setDiscountMode("amount")} style={{ minHeight: 42, border: `1px solid ${discountMode === "amount" ? "#1677d9" : "#d9e8f7"}`, borderRadius: 12, background: discountMode === "amount" ? "#1677d9" : "#fff", color: discountMode === "amount" ? "#fff" : "#17416f", fontSize: 13, fontWeight: 900 }}>{LABELS.amountValue}</button>
            </div>
            <label style={{ display: "grid", gap: 6, marginTop: 12, color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>
              {LABELS.discountType}
              <input value={discountInput} onChange={(event) => setDiscountInput(event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder={discountMode === "percent" ? "0%" : `0.00 ${BAHT}`} style={{ minHeight: 46, border: "1px solid #d9e8f7", borderRadius: 12, padding: "0 12px", color: "#0f2745", fontSize: 16, fontWeight: 900, outline: "none" }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 12, borderRadius: 12, background: "#f7fbff", padding: 10 }}>
              <span style={{ color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>{LABELS.subtotal}</span>
              <b style={{ color: "#17416f", fontSize: 12 }}>{money(subtotalAmount)} {BAHT}</b>
              <span style={{ color: "#d62929", fontSize: 11, fontWeight: 800 }}>{LABELS.discount}</span>
              <b style={{ color: "#d62929", fontSize: 12 }}>- {money(discountAmount)} {BAHT}</b>
              <span style={{ color: "#1677d9", fontSize: 12, fontWeight: 900 }}>{LABELS.totalAfterDiscount}</span>
              <b style={{ color: "#1677d9", fontSize: 14 }}>{money(totalAmount)} {BAHT}</b>
            </div>
            <button type="button" onClick={() => setDiscountOpen(false)} style={{ width: "100%", minHeight: 46, marginTop: 12, border: 0, borderRadius: 13, background: "#1677d9", color: "#fff", fontSize: 14, fontWeight: 900 }}>
              {LABELS.apply}
            </button>
          </section>
        </div>
      ) : null}

      {heldListOpen ? (
        <div role="dialog" aria-modal="true" aria-label={LABELS.heldOrders} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(94vw, 430px)", maxHeight: "86dvh", overflow: "hidden", border: "1px solid #d9e8f7", borderRadius: 18, background: "#f5f8fb", boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: "1px solid #d9e8f7", background: "#fff", padding: 14 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 900 }}>{LABELS.heldOrders}</h2>
                <p style={{ margin: "2px 0 0", color: "#7a8fa8", fontSize: 11 }}>{heldOrders.length} {LABELS.itemCount}</p>
              </div>
              <button type="button" onClick={() => setHeldListOpen(false)} aria-label={LABELS.close} style={{ display: "flex", width: 36, height: 36, minHeight: 36, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <X size={18} />
              </button>
            </header>
            <div style={{ maxHeight: "calc(86dvh - 66px)", overflowY: "auto", padding: 12 }}>
              {heldLoading ? (
                <div style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 16, color: "#7a8fa8", fontSize: 13, fontWeight: 800, textAlign: "center" }}>...</div>
              ) : null}
              {heldError ? (
                <div style={{ border: "1px solid #ffd7d7", borderRadius: 14, background: "#fff8f8", padding: 12, color: "#d62929", fontSize: 12, fontWeight: 800 }}>{heldError}</div>
              ) : null}
              {!heldLoading && !heldOrders.length && !heldError ? (
                <div style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 16, color: "#7a8fa8", fontSize: 13, fontWeight: 800, textAlign: "center" }}>{LABELS.noHeldOrders}</div>
              ) : null}
              <div style={{ display: "grid", gap: 10 }}>
                {heldOrders.map((order) => (
                  <article key={order.id} style={{ border: "1px solid #d9e8f7", borderRadius: 14, background: "#fff", padding: 12, boxShadow: "0 4px 12px rgba(15,39,69,0.06)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start" }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", overflow: "hidden", color: "#0f2745", fontSize: 13, fontWeight: 900, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.orderNo}</strong>
                        <span style={{ color: "#7a8fa8", fontSize: 10 }}>{order.itemCount} {LABELS.itemCount}</span>
                      </div>
                      <b style={{ color: "#1677d9", fontSize: 14 }}>{money(order.total)} {BAHT}</b>
                    </div>
                    <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                      {order.items.slice(0, 5).map((item, index) => (
                        <div key={`${order.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, borderRadius: 10, background: "#f7fbff", padding: "8px 10px" }}>
                          <span style={{ overflow: "hidden", color: "#0f2745", fontSize: 11, fontWeight: 800, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name} x{item.quantity}</span>
                          <b style={{ color: "#17416f", fontSize: 11 }}>{money(item.lineTotal)} {BAHT}</b>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {paymentOpen ? (
        <div role="dialog" aria-modal="true" aria-label={LABELS.choosePayment} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(92vw, 390px)", border: "1px solid #d9e8f7", borderRadius: 18, background: "#fff", padding: 14, boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f2745", fontSize: 16, fontWeight: 900 }}>{LABELS.choosePayment}</h2>
                <p style={{ margin: "2px 0 0", color: "#1677d9", fontSize: 14, fontWeight: 900 }}>{money(totalAmount)} {BAHT}</p>
              </div>
              <button type="button" onClick={() => setPaymentOpen(false)} aria-label={LABELS.close} style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: "1px solid #d9e8f7", borderRadius: 999, background: "#fff", color: "#17416f" }}>
                <X size={17} />
              </button>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <button type="button" style={{ display: "grid", minHeight: 112, justifyItems: "center", alignContent: "center", gap: 8, border: "1px solid #cfe2f5", borderRadius: 15, background: "#f7fbff", color: "#0f2745", fontSize: 14, fontWeight: 900 }}>
                <span style={{ display: "flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#eaf5ff", color: "#1677d9" }}>
                  <Banknote size={25} />
                </span>
                {LABELS.cash}
              </button>
              <button type="button" style={{ display: "grid", minHeight: 112, justifyItems: "center", alignContent: "center", gap: 8, border: "1px solid #cfe2f5", borderRadius: 15, background: "#f7fbff", color: "#0f2745", fontSize: 14, fontWeight: 900 }}>
                <span style={{ display: "flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#eaf5ff", color: "#1677d9" }}>
                  <Landmark size={25} />
                </span>
                {LABELS.transfer}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {holdOpen ? (
        <div role="dialog" aria-modal="true" aria-label={LABELS.cancelBill} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,39,69,0.35)", padding: 16 }}>
          <section style={{ width: "min(92vw, 380px)", border: "1px solid #ffd7d7", borderRadius: 18, background: "#fff", padding: 14, boxShadow: "0 18px 48px rgba(15,39,69,0.22)" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 style={{ margin: 0, color: "#d62929", fontSize: 16, fontWeight: 900 }}>{LABELS.cancelBill}</h2>
              <button type="button" onClick={() => setHoldOpen(false)} aria-label={LABELS.close} style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: "1px solid #ffd7d7", borderRadius: 999, background: "#fff", color: "#d62929" }}>
                <X size={17} />
              </button>
            </header>
            <p style={{ margin: "8px 0 0", color: "#7a8fa8", fontSize: 12, fontWeight: 700 }}>{orderNo}</p>
            <label style={{ display: "grid", gap: 6, marginTop: 12, color: "#7a8fa8", fontSize: 11, fontWeight: 800 }}>
              {LABELS.enterPin}
              <input value={holdPin} onChange={(event) => setHoldPin(event.target.value)} type="password" inputMode="numeric" autoComplete="off" style={{ minHeight: 46, border: "1px solid #ffd7d7", borderRadius: 12, padding: "0 12px", color: "#0f2745", fontSize: 16, fontWeight: 900, outline: "none" }} />
            </label>
            {holdError ? <p style={{ margin: "8px 0 0", color: "#d62929", fontSize: 12, fontWeight: 800 }}>{holdError}</p> : null}
            <button type="button" onClick={cancelBill} disabled={!holdPin.trim() || holdLoading} style={{ width: "100%", minHeight: 46, marginTop: 12, border: 0, borderRadius: 13, background: !holdPin.trim() || holdLoading ? "#f2a6a6" : "#d62929", color: "#fff", fontSize: 14, fontWeight: 900 }}>
              {holdLoading ? "..." : LABELS.cancelBill}
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
