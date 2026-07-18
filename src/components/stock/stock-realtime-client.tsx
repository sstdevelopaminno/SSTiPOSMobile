"use client";

import { Boxes, ChevronLeft, ChevronRight, PackagePlus, Pencil, Plus, Search, ShoppingBag, Trash2, Wheat } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 5;

type Product = { id: string; sku: string | null; name: string; category: string; price: number; isActive: boolean; stockDeductionMode: string };
type Ingredient = { id: string; name: string; baseUnit: string; quantityOnHand: number; reorderLevel: number; updatedAt: string | null; status: "ok" | "low" | "out" };
type SaleDeduction = { id: string; ingredientId: string | null; quantityDelta: number; reason: string | null; createdAt: string | null };

export type StockSnapshot = {
  products: Product[];
  categories: string[];
  ingredients: Ingredient[];
  recentSaleDeductions: SaleDeduction[];
  summary: { activeProducts: number; categories: number; trackedIngredients: number; lowIngredients: number; outIngredients: number };
  refreshedAt: string;
};

type ApiResponse = { data?: StockSnapshot; error?: { message?: string } };
type Mode = "products" | "ingredients";
type ModalState = { type: "product"; product?: Product } | { type: "ingredient"; ingredient?: Ingredient } | { type: "adjust"; ingredient: Ingredient } | null;

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function qty(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 3 });
}

function cleanStockName(name: string) {
  return name.replace(/^STOCK:PRD-/i, "").replace(/-\d{5,}:/g, " / ").replace(/:/g, " / ");
}

function statusText(status: Ingredient["status"]) {
  if (status === "out") return "หมด";
  if (status === "low") return "ต่ำ";
  return "พร้อม";
}

async function sendStockRequest(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
  const response = await fetch("/api/mobile/stock", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const json = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok || json?.error) throw new Error(json?.error?.message ?? "ทำรายการไม่สำเร็จ");
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof ShoppingBag; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[62px] items-center justify-center gap-2 border-b-[3px] text-[16px] font-black outline-none transition focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 ${
        active ? "border-[#1677d9] bg-white text-[#1677d9]" : "border-transparent bg-[#f8fbff] text-[#6b7f99]"
      }`}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  return (
    <div className="grid min-h-[220px] place-items-center px-6 py-8 text-center">
      <div>
        <p className="m-0 text-[16px] font-black text-[#0f2745]">ไม่พบรายการ</p>
        <p className="m-0 mt-2 text-[13px] font-bold text-[#7a8fa8]">{mode === "products" ? "ลองเปลี่ยนคำค้นหาหรือเพิ่มสินค้าใหม่" : "ลองเปลี่ยนคำค้นหาหรือเพิ่มวัตถุดิบใหม่"}</p>
      </div>
    </div>
  );
}

export function StockRealtimeClient({ initialSnapshot }: { initialSnapshot: StockSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [mode, setMode] = useState<Mode>("products");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return snapshot.products.filter((product) => !search || [product.name, product.sku ?? "", product.category, money(product.price)].join(" ").toLowerCase().includes(search));
  }, [query, snapshot.products]);
  const filteredIngredients = useMemo(() => {
    const search = query.trim().toLowerCase();
    return snapshot.ingredients.filter((ingredient) => !search || [cleanStockName(ingredient.name), ingredient.baseUnit, qty(ingredient.quantityOnHand), statusText(ingredient.status)].join(" ").toLowerCase().includes(search));
  }, [query, snapshot.ingredients]);

  const activeTotal = mode === "products" ? filteredProducts.length : filteredIngredients.length;
  const pageCount = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedProducts = filteredProducts.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const pagedIngredients = filteredIngredients.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const isProductsMode = mode === "products";

  const refreshStock = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setRefreshing(true);
      const response = await fetch("/api/mobile/stock", { cache: "no-store" });
      const json = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || json?.error || !json?.data) {
        setError(json?.error?.message ?? "โหลดสต็อกล่าสุดไม่สำเร็จ");
        return;
      }
      setSnapshot(json.data);
      setError("");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshStock(true);
    }, 3000);
    const handleFocus = () => void refreshStock(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshStock]);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setPage(0);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  async function handleDelete(kind: "product" | "ingredient", id: string) {
    const confirmed = window.confirm(kind === "product" ? "ปิดการขายสินค้านี้?" : "ลบวัตถุดิบนี้?");
    if (!confirmed) return;
    setSaving(true);
    setError("");
    try {
      await sendStockRequest("DELETE", { kind, id });
      await refreshStock(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="relative -mx-4 -mt-[calc(max(18px,env(safe-area-inset-top))+8px)] grid gap-3 pb-4 text-[#0f2745]">
      <div className="sticky top-0 z-30 bg-[#f7fbff] px-3 pb-2">
        <div className="overflow-hidden rounded-[18px] border border-[#d4e5f8] bg-white shadow-[0_12px_28px_rgba(15,39,69,0.10)]">
          <div className="grid grid-cols-2">
            <TabButton active={isProductsMode} icon={ShoppingBag} label="สินค้า" onClick={() => selectMode("products")} />
            <TabButton active={!isProductsMode} icon={Boxes} label="วัตถุดิบ" onClick={() => selectMode("ingredients")} />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_48px_48px] gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_56px_56px]">
            <label className="grid h-12 grid-cols-[auto_1fr] items-center gap-2 rounded-[14px] border border-[#cfe1f5] bg-[#fbfdff] px-3 shadow-inner focus-within:border-[#1677d9] focus-within:ring-2 focus-within:ring-[#b9dcff]">
              <Search size={20} className="text-[#5f7491]" aria-hidden="true" />
              <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="ค้นหาสินค้า..." className="min-w-0 bg-transparent text-[14px] font-bold text-[#0f2745] outline-none placeholder:text-[#9aaac0]" aria-label="ค้นหาสินค้าหรือวัตถุดิบ" />
            </label>
            <button type="button" onClick={() => setModal({ type: "product" })} className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#1677d9] text-white shadow-[0_8px_18px_rgba(22,119,217,0.24)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:h-14 sm:w-14" aria-label="เพิ่มสินค้า" title="เพิ่มสินค้า">
              <PackagePlus size={23} />
            </button>
            <button type="button" onClick={() => setModal({ type: "ingredient" })} className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#16a34a] text-white shadow-[0_8px_18px_rgba(22,163,74,0.20)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 sm:h-14 sm:w-14" aria-label="หมวดหมู่" title="หมวดหมู่">
              <Wheat size={23} />
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="mx-3 rounded-[14px] border border-[#fecaca] bg-[#fff1f1] p-3 text-[13px] font-black text-[#d62929]" role="alert">{error}</div> : null}

      <div className="mx-3 overflow-hidden rounded-[18px] border border-[#d4e5f8] bg-white shadow-[0_10px_24px_rgba(15,39,69,0.08)]">
        <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_40px_64px_66px] items-center gap-2 bg-[#edf6ff] px-3 text-[12px] font-black text-[#587398] sm:grid-cols-[minmax(0,1fr)_70px_90px_112px] sm:px-5 sm:text-[14px]">
          <span>ชื่อสินค้า</span>
          <span className="text-center">จำนวน</span>
          <span className="text-right">ราคา</span>
          <span className="text-center">การจัดการ</span>
        </div>

        {refreshing ? (
          <div className="grid min-h-[240px] place-items-center px-4 py-8 text-center text-[14px] font-black text-[#587398]">กำลังโหลดข้อมูล...</div>
        ) : activeTotal === 0 ? (
          <EmptyState mode={mode} />
        ) : isProductsMode ? (
          pagedProducts.map((product) => (
            <article key={product.id} className="grid min-h-[88px] grid-cols-[minmax(0,1fr)_40px_64px_66px] items-center gap-2 border-t border-[#dbe9f7] px-3 py-3 sm:min-h-[104px] sm:grid-cols-[minmax(0,1fr)_70px_90px_112px] sm:px-5">
              <div className="min-w-0">
                <h3 className="m-0 line-clamp-1 text-[13px] font-black leading-snug text-[#061736] sm:text-[17px]">{product.name}</h3>
                <p className="m-0 mt-1 line-clamp-1 text-[10px] font-bold text-[#587398] sm:text-[13px]">{product.category} / {product.sku ?? "-"}</p>
              </div>
              <b className="text-center text-[14px] text-[#061736] sm:text-[18px]">1</b>
              <b className="text-right text-[13px] text-[#1677d9] sm:text-[18px]">฿{money(product.price)}</b>
              <div className="relative flex items-center justify-end gap-1 pt-3 sm:gap-2 sm:pt-0">
                <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full sm:-top-3 ${product.isActive ? "bg-[#16a34a]" : "bg-[#cbd5e1]"}`} aria-label={product.isActive ? "พร้อมขาย" : "ปิดใช้งาน"} />
                <button type="button" aria-label={`แก้ไขสินค้า ${product.name}`} onClick={() => setModal({ type: "product", product })} className="grid h-9 w-7 place-items-center rounded-[9px] border border-[#cfe4fb] bg-[#f2f8ff] text-[#1677d9] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:h-11 sm:w-11"><Pencil size={15} /></button>
                <button type="button" aria-label={`ลบสินค้า ${product.name}`} onClick={() => void handleDelete("product", product.id)} disabled={saving} className="grid h-9 w-7 place-items-center rounded-[9px] border border-[#fecaca] bg-[#fff1f1] text-[#ef4444] outline-none transition active:scale-95 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 sm:h-11 sm:w-11"><Trash2 size={15} /></button>
              </div>
            </article>
          ))
        ) : (
          pagedIngredients.map((ingredient) => (
            <article key={ingredient.id} className="grid min-h-[88px] grid-cols-[minmax(0,1fr)_40px_64px_66px] items-center gap-2 border-t border-[#dbe9f7] px-3 py-3 sm:min-h-[104px] sm:grid-cols-[minmax(0,1fr)_70px_90px_112px] sm:px-5">
              <div className="min-w-0">
                <h3 className="m-0 line-clamp-1 text-[13px] font-black leading-snug text-[#061736] sm:text-[17px]">{cleanStockName(ingredient.name)}</h3>
                <p className="m-0 mt-1 line-clamp-1 text-[10px] font-bold text-[#587398] sm:text-[13px]">เตือน {qty(ingredient.reorderLevel)} {ingredient.baseUnit}</p>
              </div>
              <b className="text-center text-[13px] text-[#061736] sm:text-[17px]">{qty(ingredient.quantityOnHand)}</b>
              <b className="text-right text-[13px] text-[#1677d9] sm:text-[18px]">-</b>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button type="button" aria-label={`เพิ่มจำนวนวัตถุดิบ ${cleanStockName(ingredient.name)}`} onClick={() => setModal({ type: "adjust", ingredient })} className="hidden h-9 w-9 place-items-center rounded-[9px] bg-[#1677d9] text-white outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:grid"><Plus size={15} /></button>
                <button type="button" aria-label={`แก้ไขวัตถุดิบ ${cleanStockName(ingredient.name)}`} onClick={() => setModal({ type: "ingredient", ingredient })} className="grid h-9 w-7 place-items-center rounded-[9px] border border-[#cfe4fb] bg-[#f2f8ff] text-[#1677d9] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:h-11 sm:w-11"><Pencil size={15} /></button>
                <button type="button" aria-label={`ลบวัตถุดิบ ${cleanStockName(ingredient.name)}`} onClick={() => void handleDelete("ingredient", ingredient.id)} disabled={saving} className="grid h-9 w-7 place-items-center rounded-[9px] border border-[#fecaca] bg-[#fff1f1] text-[#ef4444] outline-none transition active:scale-95 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 sm:h-11 sm:w-11"><Trash2 size={15} /></button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mx-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[18px] border border-[#d4e5f8] bg-white p-3 shadow-[0_8px_20px_rgba(15,39,69,0.07)]">
        <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage <= 0} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-[13px] border border-[#d9e8f7] bg-[#f8fbff] px-2 text-[12px] font-black text-[#17416f] outline-none transition active:scale-95 disabled:text-[#9aaac0] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:px-4 sm:text-[14px]"><ChevronLeft size={18} />ก่อนหน้า</button>
        <span className="whitespace-nowrap text-[13px] font-black text-[#587398] sm:text-[17px]">หน้า <b className="text-[#0f2745]">{currentPage + 1}</b> / {pageCount}</span>
        <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-[13px] bg-[#1677d9] px-2 text-[12px] font-black text-white outline-none transition active:scale-95 disabled:bg-[#dbeafe] disabled:text-[#8aa0bb] focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2 sm:px-4 sm:text-[14px]">ถัดไป<ChevronRight size={18} /></button>
      </div>

      <p className="sr-only" aria-live="polite">{refreshing ? "กำลังโหลดข้อมูล" : `แสดง ${activeTotal} รายการ`}</p>

      {modal ? (
        <StockModal
          modal={modal}
          categories={snapshot.categories}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={async (method, payload) => {
            setSaving(true);
            setError("");
            try {
              await sendStockRequest(method, payload);
              setModal(null);
              await refreshStock(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}

function StockModal({ modal, categories, saving, onClose, onSave }: {
  modal: Exclude<ModalState, null>;
  categories: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (method: "POST" | "PATCH", payload: Record<string, unknown>) => Promise<void>;
}) {
  const isProduct = modal.type === "product";
  const isIngredient = modal.type === "ingredient";
  const product = isProduct ? modal.product : undefined;
  const ingredient = isIngredient ? modal.ingredient : modal.type === "adjust" ? modal.ingredient : undefined;
  const categoryOptions = useMemo(() => {
    const fallback = categories.length ? categories : ["ทั่วไป"];
    return Array.from(new Set([product?.category, ...fallback].filter((value): value is string => Boolean(value))));
  }, [categories, product?.category]);
  const [name, setName] = useState(product?.name ?? (ingredient ? cleanStockName(ingredient.name) : ""));
  const [category, setCategory] = useState(product?.category ?? categoryOptions[0] ?? "ทั่วไป");
  const [price, setPrice] = useState(product ? String(product.price) : "0");
  const [baseUnit, setBaseUnit] = useState(ingredient?.baseUnit || "piece");
  const [quantity, setQuantity] = useState(ingredient ? String(ingredient.quantityOnHand) : "0");
  const [reorder, setReorder] = useState(ingredient ? String(ingredient.reorderLevel) : "0");
  const [delta, setDelta] = useState("");

  async function submit() {
    if (modal.type === "adjust") {
      await onSave("PATCH", { action: "restock", ingredientId: modal.ingredient.id, quantityDelta: Number(delta || 0), reason: "Mobile stock quantity update" });
      return;
    }
    if (modal.type === "product") {
      await onSave(product ? "PATCH" : "POST", { kind: "product", id: product?.id, name, category, price: Number(price || 0), isActive: product?.isActive ?? true });
      return;
    }
    await onSave(ingredient ? "PATCH" : "POST", { kind: "ingredient", id: ingredient?.id, name, baseUnit, quantityOnHand: Number(quantity || 0), reorderLevel: Number(reorder || 0) });
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[220] grid place-items-center bg-[rgba(15,39,69,0.42)] p-4">
      <section className="w-full max-w-[440px] rounded-[24px] bg-white p-4 shadow-[0_24px_70px_rgba(15,39,69,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-[20px] font-black text-[#0f2745]">{modal.type === "adjust" ? "เพิ่ม/ลดจำนวน" : isProduct ? product ? "แก้ไขสินค้า" : "เพิ่มสินค้า" : ingredient ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"}</h2>
          <button type="button" onClick={onClose} className="h-10 rounded-[12px] border border-[#d9e8f7] bg-white px-4 text-[13px] font-black text-[#17416f] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2">ปิด</button>
        </div>
        <div className="mt-4 grid gap-3">
          {modal.type === "adjust" ? (
            <>
              <p className="m-0 rounded-[14px] bg-[#f8fbff] p-3 text-[14px] font-black text-[#0f2745]">{cleanStockName(modal.ingredient.name)} คงเหลือ {qty(modal.ingredient.quantityOnHand)} {modal.ingredient.baseUnit}</p>
              <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                จำนวนที่ปรับ
                <input value={delta} onChange={(event) => setDelta(event.target.value)} type="number" step="0.001" placeholder="เพิ่ม เช่น 10 / ลด เช่น -2" className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
              </label>
            </>
          ) : (
            <>
              <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                {isProduct ? "ชื่อสินค้า" : "ชื่อวัตถุดิบ"}
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={isProduct ? "เช่น ก๋วยเตี๋ยวไก่ตุ๋น" : "เช่น เส้นก๋วยเตี๋ยว"} className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
              </label>
              {isProduct ? (
                <>
                  <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                    หมวดหมู่
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]">
                      {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <p className="m-0 rounded-[12px] bg-[#eef6ff] px-3 py-2 text-[12px] font-bold text-[#587398]">รหัสสินค้าจะสร้างให้อัตโนมัติเมื่อบันทึก</p>
                  <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                    ราคา
                    <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" placeholder="0.00" className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
                  </label>
                </>
              ) : (
                <>
                  <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                    หน่วย
                    <input value={baseUnit} onChange={(event) => setBaseUnit(event.target.value)} placeholder="เช่น gram, piece" className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
                  </label>
                  <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                    จำนวนคงเหลือ
                    <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" placeholder="0" className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
                  </label>
                  <label className="grid gap-1 text-[12px] font-black text-[#587398]">
                    จุดเตือน
                    <input value={reorder} onChange={(event) => setReorder(event.target.value)} type="number" placeholder="0" className="h-12 rounded-[14px] border border-[#d9e8f7] bg-[#f8fbff] px-3 text-[15px] font-bold text-[#0f2745] outline-none focus-visible:ring-2 focus-visible:ring-[#1677d9]" />
                  </label>
                </>
              )}
            </>
          )}
        </div>
        <button type="button" onClick={() => void submit()} disabled={saving} className="mt-4 h-12 w-full rounded-[15px] bg-[#1677d9] text-[15px] font-black text-white outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#1677d9] focus-visible:ring-offset-2">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </section>
    </div>
  );
}
