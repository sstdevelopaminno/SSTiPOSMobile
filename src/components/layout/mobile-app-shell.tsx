import { BottomNav } from "@/components/layout/bottom-nav";
import type { MobileScope } from "@/types/contracts";

export function MobileAppShell({ children, title, subtitle, brand, action, scope, showBottomNav = true }: { children: React.ReactNode; title?: string; subtitle?: string; brand?: React.ReactNode; action?: React.ReactNode; scope?: MobileScope; showBottomNav?: boolean }) {
  return (
    <main
      className="mobile-shell mx-auto max-w-[430px]"
      style={{
        position: "relative",
        height: "100dvh",
        minHeight: "100dvh",
        maxWidth: 430,
        margin: "0 auto",
        overflowX: "hidden",
        overflowY: "auto",
        overscrollBehavior: "contain",
        padding: "max(18px, env(safe-area-inset-top)) 16px max(138px, calc(env(safe-area-inset-bottom) + 126px))",
        background: "#f7fbff",
        color: "#0f2745",
        fontFamily: "Arial, Tahoma, sans-serif",
      }}
    >
      <header className="mb-5 flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          {brand}
          {title ? <h1 className="m-0 text-[24px] font-black leading-tight text-[#0f2745]">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-[14px] font-semibold leading-snug text-[#587398]">{subtitle}</p> : null}
        </div>
        {action ? (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
            style={{
              display: "flex",
              height: 48,
              width: 48,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid #e4effb",
              boxShadow: "0 8px 22px rgba(15, 39, 69, 0.1)",
            }}
          >
            {action}
          </div>
        ) : null}
      </header>
      {children}
      {showBottomNav && scope ? <BottomNav role={scope.role} /> : null}
    </main>
  );
}
