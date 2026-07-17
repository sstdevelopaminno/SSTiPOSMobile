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
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-2"
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        padding: "0 8px max(8px, env(safe-area-inset-bottom))",
      }}
    >
      <nav
        aria-label="เมนูหลัก"
        className="pointer-events-auto relative mx-auto h-[82px] w-full max-w-[430px] overflow-visible rounded-[24px] border border-[#cfe4fb] bg-white shadow-[0_-10px_30px_rgba(15,39,69,0.12)]"
        style={{
          position: "relative",
          height: 82,
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          overflow: "visible",
          border: "1px solid #cfe4fb",
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 -10px 30px rgba(15, 39, 69, 0.12)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-52px] h-[108px] w-[108px] -translate-x-1/2 rounded-full bg-[#f7fbff]"
          style={{
            position: "absolute",
            top: -52,
            left: "50%",
            height: 108,
            width: 108,
            transform: "translateX(-50%)",
            borderRadius: 999,
            background: "#f7fbff",
            pointerEvents: "none",
          }}
        />

        <div
          className="relative grid h-full"
          style={{
            position: "relative",
            display: "grid",
            height: "100%",
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const isProduct = href === "/stock";

            if (isProduct) {
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="relative z-10 flex min-w-0 touch-manipulation items-start justify-center text-center no-underline outline-none transition-transform duration-200 active:scale-95"
                  style={{
                    position: "relative",
                    zIndex: 10,
                    display: "flex",
                    minWidth: 0,
                    alignItems: "flex-start",
                    justifyContent: "center",
                    textAlign: "center",
                    textDecoration: "none",
                    outline: "none",
                    transition: "transform 180ms ease, color 180ms ease",
                  }}
                >
                  <span
                    className="flex flex-col items-center justify-center gap-1 rounded-[30px] border bg-white"
                    style={{
                      display: "flex",
                      width: 86,
                      height: 96,
                      marginTop: -32,
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      border: active ? "1px solid #b7d8fb" : "1px solid #cfe4fb",
                      borderRadius: 30,
                      background: "#fff",
                      color: active ? "#1677d9" : "#1677d9",
                      boxShadow: active
                        ? "0 14px 34px rgba(22, 119, 217, 0.28)"
                        : "0 10px 28px rgba(22, 119, 217, 0.18)",
                      transform: active ? "scale(1.05)" : "scale(1)",
                      transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                    }}
                  >
                    <Icon aria-hidden="true" size={34} strokeWidth={2.25} />
                    <span
                      style={{
                        color: active ? "#1677d9" : "#214461",
                        fontSize: 12,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative z-10 flex min-w-0 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-center no-underline outline-none transition active:scale-95"
                style={{
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                  minWidth: 0,
                  minHeight: 76,
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "0 4px",
                  color: active ? "#1677d9" : "#53657c",
                  textAlign: "center",
                  textDecoration: "none",
                  outline: "none",
                  transition: "transform 160ms ease, color 160ms ease",
                }}
              >
                <span
                  className="flex items-center justify-center rounded-[14px]"
                  style={{
                    display: "flex",
                    height: 38,
                    width: 38,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 14,
                    background: active ? "#eef6ff" : "transparent",
                    color: active ? "#1677d9" : "#53657c",
                    transition: "background 160ms ease, color 160ms ease",
                  }}
                >
                  <Icon aria-hidden="true" size={23} strokeWidth={active ? 2.45 : 2.2} />
                </span>
                <span
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: active ? "#1677d9" : "#53657c",
                    fontSize: 11,
                    fontWeight: active ? 900 : 800,
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
