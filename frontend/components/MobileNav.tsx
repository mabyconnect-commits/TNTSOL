"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Floor", ic: "🔥" },
  { href: "/portfolio", label: "Portfolio", ic: "💼" },
  { href: "/launch", label: "Launch", ic: "🧨" },
  { href: "/redeem", label: "Redeem", ic: "🏦" },
  { href: "/token/peped", label: "Trade", ic: "⚡" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={isActive(pathname, it.href) ? "active" : ""}>
          <span className="ic">{it.ic}</span>
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
