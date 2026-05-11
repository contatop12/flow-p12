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
 * Cartão estilo referência: fundo #1e1e1e, cantos amplos, bordo quase invisível,
 * sem sombra pesada (minimalista).
 */
export function NodeShell({ selected, className, children }: NodeShellProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/[0.05] bg-[#1e1e1e] text-left",
        selected && "ring-1 ring-white/30",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Cabeçalho tipo “Note / Input” das refs: ícone + título em branco. */
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
    <div className="flex items-center justify-between gap-2 px-3.5 pt-3.5 pb-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 text-zinc-100/95" strokeWidth={1.75} aria-hidden />
        <span className="text-[13px] font-medium tracking-tight text-zinc-50 truncate">{title}</span>
      </div>
      {right}
    </div>
  );
}
