import { BottomNav } from "@/components/layout/bottom-nav";
import type { MobileScope } from "@/types/contracts";

export function MobileAppShell({ children, title, subtitle, brand, action, scope, showBottomNav = true }: { children: React.ReactNode; title?: string; subtitle?: string; brand?: React.ReactNode; action?: React.ReactNode; scope?: MobileScope; showBottomNav?: boolean }) {
  return (
    <main className="mobile-shell mx-auto max-w-[430px]">
      <header className="mb-4 flex items-center justify-between">
        <div>
          {brand}
          {title ? <h1 className="text-xl font-bold">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">{action}</div> : null}
      </header>
      {children}
      {showBottomNav && scope ? <BottomNav role={scope.role} /> : null}
    </main>
  );
}
