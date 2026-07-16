"use client";

import { Bell, RefreshCcw, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

const APP_NOTICE_VERSION = "2026-07-16-pwa-notifications";
const NOTICE_STORAGE_KEY = "sstipos_mobile_notice_version";

type Notice = {
  title: string;
  message: string;
  tone: "info" | "warning" | "success";
  action?: "reload" | "permission";
};

function canUseSystemNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

async function showSystemNotification(title: string, message: string) {
  if (!canUseSystemNotifications() || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body: message,
        icon: "/brand/cpipos-symbol.png",
        badge: "/brand/cpipos-symbol.png",
        tag: "sstipos-mobile-notice",
      });
    } else {
      new Notification(title, { body: message, icon: "/brand/cpipos-symbol.png", tag: "sstipos-mobile-notice" });
    }
  } catch {
    // In-app banner remains the primary notification path.
  }
}

export function MobileNotificationBar() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SSTIPOS_SW_READY") {
          window.dispatchEvent(new CustomEvent("sstipos:notify", {
            detail: { title: "PWA พร้อมใช้งาน", message: "ระบบพร้อมทำงานบนมือถือแล้ว", tone: "success" },
          }));
        }
      });
    }

    const previousVersion = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (previousVersion !== APP_NOTICE_VERSION) {
      localStorage.setItem(NOTICE_STORAGE_KEY, APP_NOTICE_VERSION);
      const updateNotice: Notice = {
        title: "อัปเดตระบบใหม่",
        message: "โหลดเวอร์ชันล่าสุดแล้ว ระบบล็อกอินและ PWA เสถียรขึ้น",
        tone: "info",
      };
      setNotice(updateNotice);
      void showSystemNotification(updateNotice.title, updateNotice.message);
    }

    const handleOffline = () => setNotice({ title: "ออฟไลน์", message: "อินเทอร์เน็ตหลุด ระบบอาจตอบสนองช้า", tone: "warning" });
    const handleOnline = () => setNotice({ title: "ออนไลน์แล้ว", message: "เชื่อมต่ออินเทอร์เน็ตกลับมาแล้ว", tone: "success" });
    const handleCustomNotice = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Notice>>).detail;
      if (!detail?.title || !detail?.message) return;
      setNotice({
        title: detail.title,
        message: detail.message,
        tone: detail.tone ?? "info",
        action: detail.action,
      });
      void showSystemNotification(detail.title, detail.message);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("sstipos:notify", handleCustomNotice);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("sstipos:notify", handleCustomNotice);
    };
  }, []);

  if (!notice) return null;

  const colors = notice.tone === "warning"
    ? { border: "#fed7aa", bg: "#fff7ed", icon: "#f97316", text: "#7c2d12" }
    : notice.tone === "success"
      ? { border: "#bbf7d0", bg: "#f0fdf4", icon: "#16a34a", text: "#14532d" }
      : { border: "#bfdbfe", bg: "#eff6ff", icon: "#1677d9", text: "#0f2745" };

  return (
    <div style={{ position: "fixed", top: "max(8px, env(safe-area-inset-top))", left: "50%", zIndex: 120, width: "min(420px, calc(100vw - 20px))", transform: "translateX(-50%)", pointerEvents: "none" }}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center", border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.bg, padding: "10px 10px 10px 12px", color: colors.text, boxShadow: "0 16px 40px rgba(15,39,69,0.18)", pointerEvents: "auto" }}>
        <span style={{ display: "flex", width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#fff", color: colors.icon }}>
          {notice.tone === "warning" ? <WifiOff size={16} /> : <Bell size={16} />}
        </span>
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: "block", overflow: "hidden", fontSize: 13, fontWeight: 950, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notice.title}</strong>
          <span style={{ display: "block", marginTop: 2, fontSize: 11, fontWeight: 800, lineHeight: 1.35 }}>{notice.message}</span>
          {!standalone ? <span style={{ display: "block", marginTop: 3, fontSize: 10, fontWeight: 800, opacity: 0.75 }}>ติดตั้งเป็น PWA เพื่อให้แจ้งเตือนบนมือถือทำงานดีที่สุด</span> : null}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {notice.action === "reload" ? (
            <button type="button" onClick={() => window.location.reload()} aria-label="โหลดใหม่" style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: `1px solid ${colors.border}`, borderRadius: 999, background: "#fff", color: colors.icon }}>
              <RefreshCcw size={15} />
            </button>
          ) : null}
          {notice.action === "permission" && canUseSystemNotifications() ? (
            <button type="button" onClick={() => Notification.requestPermission().catch(() => undefined)} style={{ minHeight: 34, border: `1px solid ${colors.border}`, borderRadius: 999, background: "#fff", color: colors.icon, padding: "0 10px", fontSize: 11, fontWeight: 900 }}>
              เปิด
            </button>
          ) : null}
          <button type="button" onClick={() => setNotice(null)} aria-label="ปิดแจ้งเตือน" style={{ display: "flex", width: 34, height: 34, minHeight: 34, alignItems: "center", justifyContent: "center", border: `1px solid ${colors.border}`, borderRadius: 999, background: "#fff", color: colors.text }}>
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
