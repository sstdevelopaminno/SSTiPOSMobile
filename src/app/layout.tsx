import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"SSTiPOS Mobile", description:"Mobile-first POS companion for SSTiPOS", manifest:"/manifest.json" };
export const viewport: Viewport = { width:"device-width", initialScale:1, maximumScale:1, userScalable:false, viewportFit:"cover", themeColor:"#061b33" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}
