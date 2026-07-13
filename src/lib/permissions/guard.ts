import { redirect } from "next/navigation";
import { readMobileSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import type { BranchRole } from "@/types/contracts";

export async function requireMobileSession(roles?: BranchRole[]) {
  const session = await readMobileSession();
  if (!session) redirect("/login/store");
  if (roles && !roles.includes(session.role)) redirect("/orders?error=unauthorized");
  return session;
}

export async function requireOpenShift(roles?: BranchRole[]) {
  const scope = await requireMobileSession(roles);
  const supabase = createServiceClient();
  const { data: shift, error } = await supabase
    .from("shifts")
    .select("id,status,opened_at,device_code")
    .eq("tenant_id", scope.tenantId)
    .eq("branch_id", scope.branchId)
    .eq("device_code", scope.deviceCode)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!shift) {
    const canOpenShift = scope.role === "owner" || scope.role === "manager" || scope.role === "staff";
    redirect(canOpenShift ? "/shifts" : "/login/store");
  }
  return { scope, shift };
}
