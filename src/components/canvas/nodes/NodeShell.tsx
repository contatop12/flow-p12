"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

type NodeShellProps = {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Cartão minimalista: um só contorno suave (ring inset), sem “bordo sobre bordo”.
 * Cantos amplos; contraste com o canvas em vez de molduras empilhadas.
 */
export function NodeShell({ selected, className, children }: NodeShellProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-[#1e1e1e] text-left ring-1 ring-inset ring-white/[0.07]",
        selected && "ring-2 ring-inset ring-white/25",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Cabeçalho: ícone + título — integrado ao cartão, sem barra separadora. */
export function NodeCardHeader({
  title,
  icon: Icon,
  right,
}: {
  title: string;
  icon: LucideIcon;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 text-zinc-100/95" strokeWidth={1.75} aria-hidden />
        <span className="text-[13px] font-medium tracking-tight text-zinc-50 truncate">{title}</span>
      </div>
      {right}
    </div>
  );
}
