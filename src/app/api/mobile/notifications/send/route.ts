import webpush from "web-push";
import { fail, ok } from "@/lib/api/response";
import { requireActiveMobileSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PushRow = {
  endpoint: string;
  subscription: webpush.PushSubscription;
};

export async function POST(request: Request) {
  try {
    const scope = await requireActiveMobileSession({ refreshCookie: true });
    if (!scope) return fail("missing_session", "กรุณาเข้าสู่ระบบ", 401);
    if (!["owner", "manager"].includes(scope.role)) return fail("forbidden", "ไม่มีสิทธิ์ส่งแจ้งเตือน", 403);

    const env = getEnv();
    if (!env.WEB_PUSH_PUBLIC_KEY || !env.WEB_PUSH_PRIVATE_KEY) {
      return fail("push_not_configured", "ยังไม่ได้ตั้งค่า Web Push VAPID", 501);
    }

    const body = await request.json().catch(() => null) as { title?: string; message?: string; url?: string } | null;
    const title = body?.title?.trim() || "CpIPOS Mobile";
    const message = body?.message?.trim() || "มีการแจ้งเตือนใหม่";
    const url = body?.url?.startsWith("/") ? body.url : "/sales";

    webpush.setVapidDetails(env.WEB_PUSH_SUBJECT, env.WEB_PUSH_PUBLIC_KEY, env.WEB_PUSH_PRIVATE_KEY);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("mobile_push_subscriptions")
      .select("endpoint,subscription")
      .eq("tenant_id", scope.tenantId)
      .eq("branch_id", scope.branchId)
      .eq("status", "active");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as PushRow[];
    const payload = JSON.stringify({ title, body: message, url });
    let sent = 0;
    let failed = 0;

    await Promise.all(rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("mobile_push_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("endpoint", row.endpoint);
        }
      }
    }));

    return ok({ sent, failed });
  } catch (error) {
    console.error("[mobile.notifications.send]", error);
    return fail("push_send_failed", "ส่งแจ้งเตือนไม่สำเร็จ", 503);
  }
}
