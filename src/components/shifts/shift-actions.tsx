"use client";

import { LoadingDialog } from "@/components/auth/loading-dialog";
import { Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function shiftErrorMessage(error: unknown) {
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจว่า npm run dev ยังเปิดอยู่ แล้วลองใหม่";
  }
  return error instanceof Error ? error.message : "ทำรายการปิดยอดไม่สำเร็จ";
}

function normalizeCashInput(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 12);
}

export function ShiftActions({ hasOpenShift }: { hasOpenShift: boolean }) {
  const router = useRouter();
  const [openingCash, setOpeningCash] = useState("");
  const [loadingAction, setLoadingAction] = useState<"open" | "close" | null>(null);
  const [error, setError] = useState("");
  const loading = loadingAction !== null;
  const openingCashValue = openingCash.trim() === "" ? null : Number(openingCash);
  const canOpen = openingCashValue !== null && Number.isFinite(openingCashValue) && openingCashValue >= 0 && !loading;

  async function submit(action: "open" | "close") {
    if (action === "open" && !canOpen) {
      setError("กรุณากรอกจำนวนเงินทอนเริ่มต้น");
      return;
    }
    setLoadingAction(action);
    setError("");
    try {
      const res = await fetch("/api/mobile/shifts", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ action, openingCash: action === "open" ? openingCashValue : undefined })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "ทำรายการปิดยอดไม่สำเร็จ");
      const redirectTo = json?.data?.redirectTo ?? (action === "open" ? "/sales" : "/dashboard");
      router.push(redirectTo);
    } catch (err) {
      setError(shiftErrorMessage(err));
      setLoadingAction(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {hasOpenShift ? (
          <button type="button" className="w-full rounded-xl border border-[#bcd5f5] bg-white px-4 py-3 text-sm font-semibold text-[#17416f] disabled:opacity-60" disabled={loading} onClick={() => submit("close")}>
            {loadingAction === "close" ? "กำลังปิดยอด..." : "ปิดยอด"}
          </button>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#0f2745]">
                <Banknote className="h-4 w-4 text-[#1677d9]" />
                เงินทอนเริ่มต้น
              </span>
              <input
                className="h-12 w-full rounded-xl border border-[#c9dbf2] bg-white px-4 text-base font-semibold text-[#0f2745] outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-[#d8eaff]"
                value={openingCash}
                onChange={(event) => setOpeningCash(normalizeCashInput(event.target.value))}
                placeholder="0.00"
                inputMode="decimal"
                disabled={loading}
              />
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 500, 1000, 2000].map((amount) => (
                <button key={amount} type="button" className="rounded-lg border border-[#c9dbf2] bg-white px-2 py-2 text-xs font-semibold text-[#17416f]" disabled={loading} onClick={() => setOpeningCash(String(amount))}>
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <button type="button" className="w-full rounded-xl bg-[#1677d9] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={!canOpen} onClick={() => submit("open")}>
              {loadingAction === "open" ? "กำลังเปิดกะ..." : "เปิดกะและไปขาย"}
            </button>
          </div>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <LoadingDialog open={loadingAction === "open"} title="กำลังเปิดกะ" message="กำลังบันทึกเงินทอนและเตรียมเมนูขาย..." />
      <LoadingDialog open={loadingAction === "close"} title="กำลังปิดยอด" message="กำลังปิดกะของเครื่องแคชเชียร์นี้..." />
    </>
  );
}
