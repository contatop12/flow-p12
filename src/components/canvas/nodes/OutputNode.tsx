"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";

export type OutputNodeData = {
  imageUrl?: string;
  savedToGallery?: boolean;
};

export function OutputNode({ data, selected }: NodeProps) {
  const d = data as OutputNodeData;

  return (
    <div className={clsx(
      "w-52 rounded-lg border bg-white shadow-sm text-left",
      selected && "ring-2 ring-[#18181B] ring-offset-1"
    )}>
      <div className="px-3 py-2 border-b flex items-center gap-1.5">
        <span className="text-xs">📤</span>
        <span className="text-xs font-semibold text-[#18181B]">Output</span>
        {d.savedToGallery && (
          <span className="ml-auto text-[10px] text-[#16A34A]">✓ Galeria</span>
        )}
      </div>
      <div className="px-3 py-2">
        {d.imageUrl ? (
          <div className="space-y-2">
            <img
              src={d.imageUrl}
              alt="Output"
              className="w-full rounded border object-cover"
              style={{ maxHeight: 180 }}
            />
            <a
              href={d.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-[#71717A] hover:text-[#18181B] transition-colors"
            >
              Abrir ↗
            </a>
          </div>
        ) : (
          <div className="w-full h-24 rounded border border-dashed border-[#E5E2DB] flex items-center justify-center">
            <p className="text-[10px] text-[#A1A1AA]">Aguardando imagem…</p>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: "#9ca3af",
          border: "2px solid white",
          width: 10,
          height: 10,
          left: -6,
        }}
      />
    </div>
  );
}
