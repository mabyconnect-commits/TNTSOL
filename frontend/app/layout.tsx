import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { ToastProvider } from "@/components/Toast";
import TopNav from "@/components/TopNav";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "TNTSOL — Light the fuse",
  description: "Devnet token trading with a fee-gated bridge to real SOL value. Bonding curves, graduation, redemption.",
};

export const viewport: Viewport = {
  themeColor: "#0A0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <ToastProvider>
            <div className="app">
              <TopNav />
              {children}
              <MobileNav />
            </div>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
