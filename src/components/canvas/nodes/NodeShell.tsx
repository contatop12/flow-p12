"use client";

import { clsx } from "clsx";

type NodeShellProps = {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Cartão base escuro minimalista para nós do canvas. */
export function NodeShell({ selected, className, children }: NodeShellProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-sm text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        selected && "ring-2 ring-accent/45 ring-offset-2 ring-offset-zinc-950",
        className
      )}
    >
      {children}
    </div>
  );
}
