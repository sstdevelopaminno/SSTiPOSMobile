"use client";

import { Store } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StoreLoginForm() {
  const router = useRouter();
  const [storeCode, setStoreCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/auth/store-code/verify", {
        method: "POST",
        body: JSON.stringify({ storeCode }),
        signal: controller.signal
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      sessionStorage.setItem("mobileLogin", JSON.stringify(json.data));
      router.push(json.data.branches.length > 1 ? "/login/branch" : "/login/employee");
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-semibold text-[#051b35]" htmlFor="store-code">
        รหัสร้านค้า
      </label>
      <div className="flex h-[50px] items-center rounded-xl border border-[#c9dbf2] bg-[#f7fbff] px-3 transition focus-within:border-[#78abe8] focus-within:ring-2 focus-within:ring-[#cfe5ff]">
        <Store aria-hidden="true" size={24} className="mr-3 shrink-0 text-[#38669b]" />
        <input
          id="store-code"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-[#0f2745] outline-none placeholder:text-[#9aabc1]"
          value={storeCode}
          onChange={(event) => setStoreCode(event.target.value.slice(0, 32))}
          placeholder="กรอกรหัสร้านค้า"
          maxLength={32}
          autoComplete="organization"
        />
      </div>
      <p className="text-xs text-[#587398]">{storeCode.length}/32</p>
      <button
        type="submit"
        disabled={loading || storeCode.trim().length === 0}
        className="mt-2 h-[42px] w-full rounded-xl bg-[#76ace8] text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? "กำลังตรวจสอบ..." : "ถัดไป"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
