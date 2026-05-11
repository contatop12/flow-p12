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
  { href: "/canvas",    label: "Canvas",    icon: Workflow        },
  { href: "/clients",   label: "Clientes",  icon: Users           },
  { href: "/gallery",   label: "Galeria",   icon: Image           },
  { href: "/settings",  label: "Config",    icon: Settings        },
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
    return () => { cancelled = true; };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/sign-in";
  }, []);

  return (
    <nav className="h-12 border-b bg-white flex items-center px-6 gap-8 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-[#18181B] flex items-center justify-center">
          <span className="text-white text-[9px] font-bold tracking-widest">F</span>
        </div>
        <span className="text-[#18181B] font-semibold text-sm tracking-tight">
          Flow P12
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-0.5 flex-1">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                active
                  ? "bg-[#F5F4F1] text-[#18181B] font-medium"
                  : "text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F4F1]"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="flex items-center gap-4 shrink-0">
        {email && (
          <span className="text-xs text-[#A1A1AA] max-w-[160px] truncate">
            {email}
          </span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="text-xs text-[#71717A] hover:text-[#18181B] transition-colors duration-150"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
