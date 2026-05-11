"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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

      <UserButton
        appearance={{ elements: { avatarBox: "w-8 h-8" } }}
      />
    </nav>
  );
}
