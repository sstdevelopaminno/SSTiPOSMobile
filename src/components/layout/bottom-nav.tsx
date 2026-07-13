"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMobileMenuItems } from "@/lib/permissions/mobile-menu";
import type { BranchRole } from "@/types/contracts";

export function BottomNav({ role }: { role: BranchRole }) {
  const pathname = usePathname();
  const items = getMobileMenuItems(role);
  if (items.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d8e6f7] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,39,69,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-[430px]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-semibold leading-tight transition active:text-[#1677d9] ${active ? "text-[#1677d9]" : "text-[#53657c]"}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-[#eef6ff]" : ""}`}>
                <Icon size={21} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
