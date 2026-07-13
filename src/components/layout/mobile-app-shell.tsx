import { BottomNav } from "@/components/layout/bottom-nav";
import type { MobileScope } from "@/types/contracts";

export function MobileAppShell({ children, title, subtitle, brand, action, scope, showBottomNav = true }: { children: React.ReactNode; title?: string; subtitle?: string; brand?: React.ReactNode; action?: React.ReactNode; scope?: MobileScope; showBottomNav?: boolean }) {
  return (
    <main
      className="mobile-shell mx-auto max-w-[430px]"
      style={{
        minHeight: "100dvh",
        maxWidth: 430,
        margin: "0 auto",
        padding: "16px 16px max(88px, env(safe-area-inset-bottom))",
        background: "#f5f8fb",
        color: "#0f2745",
        fontFamily: "Arial, Tahoma, sans-serif",
      }}
    >
      <header className="mb-4 flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          {brand}
          {title ? <h1 className="text-xl font-bold">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            style={{
              display: "flex",
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "#fff",
              boxShadow: "0 4px 16px rgba(15, 39, 69, 0.08)",
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
