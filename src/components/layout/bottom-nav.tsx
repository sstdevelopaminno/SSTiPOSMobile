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
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d8e6f7] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,39,69,0.08)] backdrop-blur"
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        borderTop: "1px solid #d8e6f7",
        background: "rgba(255, 255, 255, 0.96)",
        padding: "6px 10px env(safe-area-inset-bottom)",
        boxShadow: "0 -10px 28px rgba(15, 39, 69, 0.1)",
      }}
    >
      <div className="mx-auto grid max-w-[430px]" style={{ display: "grid", maxWidth: 430, margin: "0 auto", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`flex min-h-[72px] touch-manipulation flex-col items-center justify-center gap-1 px-1 text-center text-[12px] font-bold leading-tight transition active:bg-[#f5faff] active:text-[#1677d9] ${active ? "text-[#1677d9]" : "text-[#53657c]"}`}
              style={{
                display: "flex",
                minHeight: 72,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "0 4px",
                color: active ? "#1677d9" : "#53657c",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.2,
                textDecoration: "none",
              }}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-[#eef6ff]" : ""}`}
                style={{
                  display: "flex",
                  height: 36,
                  width: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  background: active ? "#eef6ff" : "transparent",
                }}
              >
                <Icon size={24} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
