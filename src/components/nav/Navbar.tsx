"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Workflow,
  Users,
  Image,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/canvas", label: "Canvas", icon: Workflow },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/gallery", label: "Galeria", icon: Image },
  { href: "/settings", label: "Config", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { email?: string } } | null) => {
        if (!cancelled && data?.user?.email) setEmail(data.user.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/sign-in";
  }, []);

  return (
    <nav className="h-12 border-b border-white/10 bg-surface flex items-center px-6 gap-8 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center">
          <span className="text-zinc-900 text-[9px] font-bold tracking-widest">F</span>
        </div>
        <span className="text-ink font-semibold text-sm tracking-tight">Flow P12</span>
      </Link>

      <div className="flex items-center gap-0.5 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                active
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-muted hover:text-ink hover:bg-surface-2/80"
              )}
            >
              <Icon className="size-3.5 opacity-70" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {email && (
          <span className="text-xs text-subtle max-w-[160px] truncate">{email}</span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="text-xs text-muted hover:text-ink transition-colors duration-150"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
