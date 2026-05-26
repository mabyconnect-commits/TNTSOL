"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";

const TABS = [
  { href: "/", label: "Floor" },
  { href: "/portfolio", label: "Portfolio", badge: "3" },
  { href: "/launch", label: "Light the fuse" },
  { href: "/redeem", label: "Redeem" },
  { href: "/social", label: "Social" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/token");
  return pathname.startsWith(href);
}

export default function TopNav() {
  const pathname = usePathname();
  const wallet = useWallet();
  const toast = useToast();

  function airdrop() {
    toast.runTx({
      pending: { title: "Requesting devnet airdrop…", sub: "1 devSOL → your wallet" },
      success: { title: "Airdrop confirmed", sub: "+1 devSOL" },
      errorTitle: "Airdrop failed",
      action: () => wallet.requestAirdrop(),
    });
  }

  return (
    <header className="topnav">
      <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        <BrandMark />
        <div className="name">
          TNT<span className="red">SOL</span>
        </div>
        <div className="net">● DEVNET</div>
      </Link>

      <nav className="nav-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`nav-tab${isActive(pathname, t.href) ? " active" : ""}`}>
            {t.label}
            {t.badge ? <span className="badge">{t.badge}</span> : null}
          </Link>
        ))}
        <a className="nav-tab">Docs</a>
      </nav>

      <div className="nav-right">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M16 16l5 5" />
          </svg>
          <span>Find a token, ticker, or wallet</span>
          <kbd>⌘K</kbd>
        </div>
        <Link href="/launch" className="btn btn-primary btn-sm">
          Light a fuse
        </Link>
        {wallet.connected ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={airdrop} title="Devnet faucet · airdrop 1 devSOL">
              ⛽
            </button>
            <button className="wallet-pill" onClick={wallet.disconnect} title="Click to disconnect" style={{ cursor: "pointer" }}>
              <span className="av" />
              <span className="addr">{wallet.address}</span>
              <span className="bal">
                {wallet.devBalance === null ? "…" : wallet.devBalance.toFixed(2)}
                <small>devSOL</small>
              </span>
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={wallet.openModal}>
            {wallet.connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
