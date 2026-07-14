"use client";

import { Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingDialog } from "@/components/auth/loading-dialog";

const AUTH_REQUEST_TIMEOUT_MS = 12_000;

const THAI_KEYBOARD_TO_CODE: Record<string, string> = {
  "ๅ": "1",
  "/": "2",
  "ภ": "4",
  "ถ": "5",
  "ุ": "6",
  "ึ": "7",
  "ค": "8",
  "ต": "9",
  "จ": "0",
  "ข": "-",
  "ช": "=",
  "ๆ": "Q",
  "ไ": "W",
  "ำ": "E",
  "พ": "R",
  "ะ": "T",
  "ั": "Y",
  "ี": "U",
  "ร": "I",
  "น": "O",
  "ย": "P",
  "บ": "[",
  "ล": "]",
  "ฃ": "\\",
  "ฟ": "A",
  "ห": "S",
  "ก": "D",
  "ด": "F",
  "เ": "G",
  "้": "H",
  "่": "J",
  "า": "K",
  "ส": "L",
  "ว": ";",
  "ง": "'",
  "ผ": "Z",
  "ป": "X",
  "แ": "C",
  "อ": "V",
  "ิ": "B",
  "ื": "N",
  "ท": "M",
  "ม": ",",
  "ใ": ".",
  "ฝ": "/",
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "๘": "8",
  "๙": "9"
};

function normalizeStoreCodeInput(value: string) {
  return Array.from(value)
    .map((char) => THAI_KEYBOARD_TO_CODE[char] ?? char)
    .join("")
    .toUpperCase()
    .slice(0, 32);
}

async function readJsonResponse(response: Response, fallbackMessage: string) {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error?.message ?? fallbackMessage);
  return json;
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "ตรวจสอบรหัสร้านใช้เวลานานเกินไป กรุณาลองใหม่";
  }
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    const isLocal = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    return isLocal
      ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจว่า npm run dev ยังเปิดอยู่ แล้วลองใหม่"
      : "เชื่อมต่อ API ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต รีเฟรชหน้า แล้วลองใหม่";
  }
  return error instanceof Error ? error.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
}

function cacheBranchSelectionPayload(data: { tenant?: unknown; branches?: unknown[]; nextStep?: string }) {
  if (data.nextStep !== "branch") return;
  try {
    sessionStorage.setItem("sstipos_mobile_branch_state", JSON.stringify({ tenant: data.tenant, branches: data.branches ?? [] }));
  } catch {
    // Non-critical UI cache only. Branch selection remains server-validated.
  }
}

export function StoreLoginForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceWorkerCleanupRef = useRef<Promise<void> | null>(null);
  const [storeCode, setStoreCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canSubmit = storeCode.trim().length > 0 && !loading;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    serviceWorkerCleanupRef.current = navigator.serviceWorker.getRegistrations()
      .then(async (registrations) => {
        await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    let keepLoadingForNavigation = false;
    let timeoutId: number | null = null;

    try {
      await serviceWorkerCleanupRef.current;
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
      const res = await fetch("/api/auth/store-code/verify", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ storeCode })
      });
      const json = await readJsonResponse(res, "ตรวจสอบรหัสร้านไม่สำเร็จ");
      cacheBranchSelectionPayload(json.data);
      keepLoadingForNavigation = true;
      router.push(json.data.nextStep === "branch" ? "/login/branch" : "/login/employee");
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (!keepLoadingForNavigation) setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold text-[#051b35]" htmlFor="store-code">
          รหัสร้านค้า
        </label>
        <div
          className="flex h-[50px] cursor-text items-center rounded-xl border border-[#c9dbf2] bg-[#f7fbff] px-3 transition focus-within:border-[#78abe8] focus-within:ring-2 focus-within:ring-[#cfe5ff]"
          onClick={() => inputRef.current?.focus()}
        >
          <Store aria-hidden="true" size={24} className="pointer-events-none mr-3 shrink-0 text-[#38669b]" />
          <input
            ref={inputRef}
            id="store-code"
            className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-[#0f2745] outline-none placeholder:text-[#9aabc1]"
            value={storeCode}
            onChange={(event) => setStoreCode(normalizeStoreCodeInput(event.target.value))}
            placeholder="กรอกรหัสร้านค้า"
            type="text"
            maxLength={32}
            autoComplete="organization"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="next"
            lang="en"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-[#587398]">{storeCode.length}/32</p>
        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={loading}
          className={`mt-2 h-[46px] w-full rounded-xl text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed ${
            canSubmit ? "bg-[#0b73d9] shadow-[#8fc2ff]/60 hover:bg-[#075fbb]" : "bg-[#aacdf3] opacity-80"
          }`}
        >
          {loading ? "กำลังตรวจสอบ..." : "ถัดไป"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
      <LoadingDialog open={loading} title="กำลังตรวจสอบ" message="กำลังตรวจสอบข้อมูลร้านค้า..." />
    </>
  );
}

