import { BottomNav } from "@/components/layout/bottom-nav";
import type { MobileScope } from "@/types/contracts";

export function MobileAppShell({ children, title, scope, showBottomNav = true }: { children: React.ReactNode; title: string; scope?: MobileScope; showBottomNav?: boolean }) {
  return (
    <main className="mobile-shell mx-auto max-w-[430px]">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue">SSTiPOS Mobile</p>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </header>
      {children}
      {showBottomNav && scope ? <BottomNav role={scope.role} /> : null}
    </main>
  );
}
