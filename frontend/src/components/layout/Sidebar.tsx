"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  GitBranch,
  LayoutDashboard,
  Settings,
  Shield,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "@/lib/format";
import { APP } from "@/lib/config";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/relationships", label: "Relationships", icon: GitBranch },
  { href: "/reputation", label: "Reputation", icon: Shield },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-deep text-white shadow-sm"
                : "text-deep/70 hover:bg-deep/5 hover:text-deep",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 p-2 shadow-sm lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-deep/10 bg-white/90 px-4 py-6 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="group">
            <p className="font-display text-2xl tracking-tight text-deep">
              {APP.name}
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-sea">
              Trust Network
            </p>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {NavLinks}
        <div className="mt-auto rounded-2xl bg-foam/80 p-4 text-xs text-deep/70">
          <p className="font-medium text-deep">Stellar Testnet</p>
          <p className="mt-1">Immutable business trust records via Soroban.</p>
        </div>
      </aside>
    </>
  );
}
