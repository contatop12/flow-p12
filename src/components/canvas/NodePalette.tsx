// src/components/canvas/NodePalette.tsx
"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ImageDown,
  LayoutTemplate,
  Type,
} from "lucide-react";
import { clsx } from "clsx";

const PALETTE_CATEGORIES: {
  label: string;
  items: { type: string; icon: LucideIcon; label: string }[];
}[] = [
  {
    label: "Dados",
    items: [
      { type: "TextNode", icon: Type, label: "Text" },
      { type: "BrandIDNode", icon: BadgeCheck, label: "Brand ID" },
      { type: "ImageLayoutNode", icon: LayoutTemplate, label: "Image-Layout" },
    ],
  },
  {
    label: "Saída",
    items: [{ type: "OutputNode", icon: ImageDown, label: "Output" }],
  },
];

export function NodePalette() {
  function onDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.setData("text/plain", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="w-[200px] shrink-0 border-r border-white/10 bg-surface overflow-y-auto flex flex-col">
      <div className="px-3 py-2.5 border-b border-white/10">
        <p className="text-[10px] font-semibold text-subtle uppercase tracking-widest">Nós</p>
      </div>
      <div className="flex flex-col gap-0 py-2">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-subtle uppercase tracking-widest">
              {cat.label}
            </p>
            {cat.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={clsx(
                    "mx-2 mb-0.5 flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab",
                    "hover:bg-surface-2 active:cursor-grabbing select-none text-muted hover:text-ink transition-colors"
                  )}
                >
                  <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="text-xs">{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
