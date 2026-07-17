"use client";

import { UserRound, X } from "lucide-react";
import { useState } from "react";

export function MemberLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid min-h-[58px] touch-manipulation place-items-center rounded-[18px] border border-[#d4e5f8] bg-white px-3 text-[14px] font-black text-[#17416f] shadow-[0_8px_20px_rgba(15,39,69,0.06)] transition active:scale-[0.98] active:bg-[#f5faff]"
      >
        <span className="flex items-center justify-center gap-2">
          <UserRound className="h-5 w-5 text-[#1677d9]" strokeWidth={2.35} />
          สมาชิก
        </span>
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label="สมาชิก" className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,39,69,0.35)] p-4">
          <section className="w-[min(92vw,380px)] rounded-[22px] border border-[#d9e8f7] bg-white p-4 shadow-[0_18px_48px_rgba(15,39,69,0.22)]">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-[20px] font-black text-[#0f2745]">สมาชิก</h2>
                <p className="m-0 mt-1 text-[13px] font-bold text-[#6a7f99]">เมนูสมาชิกสำหรับการขายหน้าร้าน</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="ปิดสมาชิก" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e8f7] bg-white text-[#17416f]">
                <X size={18} />
              </button>
            </header>
            <div className="mt-4 rounded-[16px] border border-[#d9e8f7] bg-[#f8fbff] p-4 text-[13px] font-bold leading-relaxed text-[#587398]">
              พร้อมต่อข้อมูลสมาชิกจากระบบหลักในรอบถัดไป ตอนนี้ปุ่มถูกเตรียมไว้ในหน้าเมนูขายแล้ว
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
