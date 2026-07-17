"use client";

import { LoadingDialog } from "@/components/auth/loading-dialog";
import { Armchair, Bike, ReceiptText, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SalesMode = {
  href: string;
  icon: LucideIcon;
  title: string;
  caption: string;
  tone: string;
  loadingMessage: string;
};

const modes: SalesMode[] = [
  { href: "/sales/takeaway", icon: ReceiptText, title: "กลับบ้าน", caption: "เปิดออเดอร์", tone: "bg-[#eef6ff] text-[#1677d9]", loadingMessage: "กำลังเปิดออเดอร์กลับบ้าน..." },
  { href: "/sales/table", icon: Armchair, title: "เลือกโต๊ะ", caption: "เปิดโต๊ะลูกค้า", tone: "bg-[#fff6e8] text-[#d98600]", loadingMessage: "กำลังโหลดผังโต๊ะ..." },
  { href: "/sales/delivery", icon: Bike, title: "เดลิเวอรี่", caption: "เปิดออเดอร์ส่ง", tone: "bg-[#f2f0ff] text-[#6d5dfc]", loadingMessage: "กำลังโหลดออเดอร์เดลิเวอรี่..." },
];

export function SalesModeActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<SalesMode | null>(null);

  useEffect(() => {
    for (const mode of modes) router.prefetch(mode.href);
  }, [router]);

  function openMode(mode: SalesMode) {
    if (loading) return;
    setLoading(mode);
    router.push(mode.href);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const busy = loading?.href === mode.href;
          return (
            <button
              key={mode.href}
              type="button"
              className={`block min-h-[128px] touch-manipulation rounded-[18px] border border-[#d4e5f8] bg-white p-3.5 text-left shadow-[0_8px_20px_rgba(15,39,69,0.06)] transition active:scale-[0.98] active:bg-[#f5faff] disabled:opacity-70 ${busy ? "ring-2 ring-[#9dccff]" : ""}`}
              onClick={() => openMode(mode)}
              disabled={Boolean(loading)}
            >
              <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-[16px] ${mode.tone}`}>
                <Icon size={24} strokeWidth={2.3} />
              </span>
              <span className="block text-[15px] font-black leading-tight text-[#0f2745]">{mode.title}</span>
              <span className="mt-1.5 block text-[12px] font-semibold leading-snug text-[#6a7f99]">{busy ? "กำลังเปิด..." : mode.caption}</span>
            </button>
          );
        })}
      </div>
      <LoadingDialog open={Boolean(loading)} title="กำลังเปิดเมนู" message={loading?.loadingMessage ?? "กำลังโหลดข้อมูล..."} />
    </>
  );
}
