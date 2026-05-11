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
    <nav className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-6 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2 mr-4">
        <span className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
          F
        </span>
        <span className="text-white font-bold text-sm tracking-tight">
          Flow P12
        </span>
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {email ? (
          <span className="max-w-[200px] truncate text-xs text-gray-400" title={email}>
            {email}
          </span>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
