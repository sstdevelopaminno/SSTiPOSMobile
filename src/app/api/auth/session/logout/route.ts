import { ok } from "@/lib/api/response";
import { clearMobileSessionCookie, readMobileSession } from "@/lib/auth/session";
import { clearMobileFlow, createMobileFlow, writeMobileFlow } from "@/lib/auth/mobile-flow";
import { getEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LogoutAction = "logout" | "switch_branch" | "switch_device";

type TenantRow = {
  id: string;
  code: string | null;
  name: string | null;
  display_name: string | null;
};

type BranchRow = {
  id: string;
  code: string | null;
  name: string | null;
};

type UserProfileRow = {
  full_name: string | null;
};

function parseAction(value: unknown): LogoutAction {
  if (value === "switch_branch" || value === "switch_device") return value;
  return "logout";
}

function loginContextExpiresAt() {
  return new Date(Date.now() + getEnv().MOBILE_LOGIN_CONTEXT_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { action?: unknown };
  const action = parseAction(body.action);
  const scope = await readMobileSession();
  const supabase = createServiceClient();

  if (scope) {
    await supabase
      .from("pos_sessions")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", scope.sessionId);
  }

  await clearMobileSessionCookie();

  if ((action === "switch_branch" || action === "switch_device") && scope) {
    const [{ data: tenant }, { data: branch }, { data: profile }] = await Promise.all([
      supabase
        .from("tenants")
        .select("id,code,name,display_name")
        .eq("id", scope.tenantId)
        .maybeSingle<TenantRow>(),
      supabase
        .from("branches")
        .select("id,code,name")
        .eq("id", scope.branchId)
        .eq("tenant_id", scope.tenantId)
        .maybeSingle<BranchRow>(),
      supabase
        .from("users_profiles")
        .select("full_name")
        .eq("id", scope.userId)
        .maybeSingle<UserProfileRow>(),
    ]);

    if (tenant?.id && tenant.code) {
      if (action === "switch_branch") {
        const response = ok({ loggedOut: true, action, redirectTo: "/login/branch" });
        writeMobileFlow(response, createMobileFlow({
          stage: "store_verified",
          contextId: "",
          tenantId: tenant.id,
          tenantCode: tenant.code,
          tenantName: tenant.display_name || tenant.name || tenant.code,
          branchId: null,
          branchCode: null,
          branchName: null,
          userId: null,
          employeeCode: null,
          employeeName: null,
          role: null,
          deviceId: null,
          deviceCode: null,
          deviceName: null,
        }));
        return response;
      }

      if (branch?.id && scope.role) {
        const { data: context } = await supabase
          .from("pos_login_contexts")
          .insert({
            tenant_id: tenant.id,
            branch_id: branch.id,
            store_code: tenant.code,
            status: "active",
            expires_at: loginContextExpiresAt(),
            metadata: { source_app: "mobile_web", reason: "switch_cashier_device" },
          })
          .select("id")
          .single<{ id: string }>();

        if (context?.id) {
          const response = ok({ loggedOut: true, action, redirectTo: "/login/device" });
          writeMobileFlow(response, createMobileFlow({
            stage: "employee_verified",
            contextId: context.id,
            tenantId: tenant.id,
            tenantCode: tenant.code,
            tenantName: tenant.display_name || tenant.name || tenant.code,
            branchId: branch.id,
            branchCode: branch.code,
            branchName: branch.name,
            userId: scope.userId,
            employeeCode: null,
            employeeName: profile?.full_name ?? scope.userId,
            role: scope.role,
            deviceId: null,
            deviceCode: null,
            deviceName: null,
          }));
          return response;
        }
      }
    }
  }

  const response = ok({ loggedOut: true, action: "logout", redirectTo: "/login/store" });
  clearMobileFlow(response);
  return response;
}
