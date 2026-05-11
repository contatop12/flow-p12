"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { LayoutTemplate } from "lucide-react";
import { clsx } from "clsx";
import { NodeShell } from "./NodeShell";

export type ImageLayoutNodeData = {
  imageUrl?: string;
  fidelity: number;
  techMode: "auto" | "force_inspiration" | "force_strict";
  controlType: "canny" | "depth" | "mlsd" | "openpose";
};

export const IMAGE_LAYOUT_MAX_FILE_BYTES = 8 * 1024 * 1024;

const ACCEPT_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionLooksLikeImage(name: string): boolean {
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

export function validateImageLayoutFile(file: File): string | null {
  const typeOk = file.type ? ACCEPT_MIME.has(file.type.toLowerCase()) : false;
  const extOk = extensionLooksLikeImage(file.name);
  if (!typeOk && !extOk) {
    return "Formato não suportado. Use JPEG, PNG, WebP ou GIF.";
  }
  if (file.size > IMAGE_LAYOUT_MAX_FILE_BYTES) {
    const mb = IMAGE_LAYOUT_MAX_FILE_BYTES / (1024 * 1024);
    return `Arquivo muito grande (máximo ${mb} MB).`;
  }
  return null;
}

function dataTransferHasFiles(dt: DataTransfer): boolean {
  for (let i = 0; i < dt.types.length; i++) {
    if (dt.types[i] === "Files") return true;
  }
  return false;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Leitura inválida."));
    };
    reader.onerror = () => reject(new Error(reader.error?.message ?? "Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export function ImageLayoutNode({ id, data, selected }: NodeProps) {
  const d = data as ImageLayoutNodeData;
  const { setNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlNet =
    d.techMode === "force_strict" || (d.techMode === "auto" && d.fidelity > 50);

  const applyImageUrl = useCallback(
    (imageUrl: string | undefined) => {
      setNodes((nodes) =>
        nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, imageUrl } } : n))
      );
    },
    [id, setNodes]
  );

  const processFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setError(null);
      const validation = validateImageLayoutFile(file);
      if (validation) {
        setError(validation);
        return;
      }
      setLoading(true);
      try {
        const url = await readFileAsDataUrl(file);
        applyImageUrl(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível carregar a imagem.");
      } finally {
        setLoading(false);
      }
    },
    [applyImageUrl]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dataTransferHasFiles(e.dataTransfer)) {
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as HTMLElement | null;
    if (next && e.currentTarget.contains(next)) return;
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      await processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      await processFile(file);
    },
    [processFile]
  );

  return (
    <NodeShell selected={selected} className="w-52">
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <LayoutTemplate className="size-3.5 text-layout shrink-0 opacity-90" aria-hidden />
        <span className="text-[11px] font-medium tracking-tight text-zinc-200">Image-Layout</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={onFileChange}
        />
        {d.imageUrl ? (
          <div className="relative group">
            <img
              src={d.imageUrl}
              alt="Layout reference"
              className="w-full h-20 object-cover rounded-lg border border-white/10 nodrag nopan"
              draggable={false}
            />
            <button
              type="button"
              className="nodrag nopan absolute top-1 right-1 rounded bg-zinc-950/90 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 shadow border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setError(null);
                applyImageUrl(undefined);
              }}
            >
              Remover
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={clsx(
              "nodrag nopan w-full h-16 rounded-lg border border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              dragOver && "border-layout bg-layout/10",
              !dragOver && "border-white/15 hover:bg-surface-2/80",
              loading && "pointer-events-none opacity-70"
            )}
          >
            {loading ? (
              <p className="text-[10px] text-muted">Carregando…</p>
            ) : (
              <>
                <p className="text-[10px] text-subtle">Arraste imagem</p>
                <p className="text-[9px] text-subtle">ou clique</p>
              </>
            )}
          </div>
        )}
        {error && (
          <p className="text-[10px] text-red-400 leading-snug" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">Fidelidade</span>
          <span className="text-[10px] font-semibold text-zinc-200">{d.fidelity}%</span>
        </div>
        {isControlNet && (
          <div className="flex items-center gap-1 rounded border border-layout/30 bg-layout/10 px-2 py-1">
            <span className="text-[10px] text-layout font-medium">ControlNet · {d.controlType}</span>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: "#9ca3af",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="layout-out"
        style={{
          background: "#3b82f6",
          border: "2px solid #18181b",
          width: 10,
          height: 10,
          right: -6,
        }}
      />
    </NodeShell>
  );
}
