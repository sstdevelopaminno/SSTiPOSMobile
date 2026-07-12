"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Branch = { id: string; name: string | null; code: string | null };

type BranchState = {
  tenant: { name: string };
  branches: Branch[];
};

export default function BranchPage() {
  const router = useRouter();
  const [state, setState] = useState<BranchState | null>(null);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/branches/select")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "ไม่สามารถโหลดสาขาได้");
        if (active) setState(json.data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "ไม่สามารถโหลดสาขาได้");
      });
    return () => {
      active = false;
    };
  }, []);

  async function select(branchId: string) {
    setLoadingId(branchId);
    setError("");
    try {
      const res = await fetch("/api/auth/branches/select", { method: "POST", body: JSON.stringify({ branchId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "เลือกสาขาไม่สำเร็จ");
      router.push(json.data.redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เลือกสาขาไม่สำเร็จ");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <AuthShell title="เลือกสาขา" subtitle={state?.tenant.name ?? "SSTiPOS"}>
      <div className="space-y-3">
        {state?.branches.map((branch) => (
          <Button key={branch.id} className="w-full border border-slate-200 bg-white text-ink" disabled={loadingId === branch.id} onClick={() => select(branch.id)}>
            {loadingId === branch.id ? "กำลังเลือก..." : branch.name ?? branch.code ?? "สาขา"}
          </Button>
        ))}
        {!state && !error ? <p className="text-sm text-slate-500">กำลังโหลดสาขา...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </AuthShell>
  );
}
