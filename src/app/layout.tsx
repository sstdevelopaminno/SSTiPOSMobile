import type { Metadata, Viewport } from "next";
import { MobileNotificationBar } from "@/components/layout/mobile-notification-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CpIPOS Mobile",
  description: "Mobile-first POS companion for CpIPOS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CpIPOS",
  },
  icons: {
    icon: "/brand/cpipos-symbol.png",
    apple: "/brand/cpipos-symbol.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#061b33"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <MobileNotificationBar />
        {children}
      </body>
    </html>
  );
}
