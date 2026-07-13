"use client";

import { LoadingDialog } from "@/components/auth/loading-dialog";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function networkErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจว่า npm run dev ยังเปิดอยู่ แล้วลองใหม่";
  }
  return error instanceof Error ? error.message : fallback;
}

export function EmployeeLoginForm({ branchName }: { branchName: string }) {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = employeeCode.trim().length > 0 && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    let keepLoadingForNavigation = false;
    try {
      const res = await fetch("/api/auth/employee/verify", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ employeeCode })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      keepLoadingForNavigation = true;
      router.push(json.data.redirectTo);
    } catch (err) {
      setError(networkErrorMessage(err, "เข้าสู่ระบบไม่สำเร็จ"));
    } finally {
      if (!keepLoadingForNavigation) setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#17416f]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bcd5f5] bg-[#eef6ff]">
            <Store className="h-5 w-5" />
          </span>
          <span>สาขา: {branchName}</span>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#0f2745]">รหัสพนักงาน</span>
          <input
            className="w-full rounded-xl border border-[#c9dbf2] bg-white px-4 py-3 text-[#0f2745] outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-[#d8eaff]"
            placeholder="รหัสที่ตั้งไว้โดยผู้จัดการ/เจ้าของร้าน"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed ${canSubmit ? "bg-[#1677d9] hover:bg-[#075fbb]" : "bg-[#728091] opacity-90"}`}
        >
          {loading ? "กำลังยืนยัน..." : "ยืนยันพนักงาน"}
        </button>
        <button type="button" className="w-full rounded-xl border border-[#bcd5f5] bg-white px-4 py-3 text-sm font-semibold text-[#17416f]" onClick={() => router.push("/login/branch")} disabled={loading}>
          ย้อนกลับ
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
      <LoadingDialog open={loading} title="กำลังตรวจสอบ" message="กำลังยืนยันตัวตนพนักงาน..." />
    </>
  );
}
