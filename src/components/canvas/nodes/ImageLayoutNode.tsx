"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { Image as ImageIcon } from "lucide-react";
import { clsx } from "clsx";
import { NodeShell, NodeCardHeader } from "./NodeShell";
import { HANDLE_COLORS, handleProps } from "./canvasHandleStyles";

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

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dataTransferHasFiles(e.dataTransfer)) {
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as HTMLElement | null;
    if (next && e.currentTarget.contains(next)) return;
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      await processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      await processFile(file);
    },
    [processFile]
  );

  return (
    <NodeShell selected={selected} className="w-56">
      <NodeCardHeader title="Image-Layout" icon={ImageIcon} />
      <div className="px-3.5 pb-3.5 pt-0.5 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={onFileChange}
        />
        {d.imageUrl ? (
          <div className="relative group rounded-2xl bg-white p-1.5">
            <img
              src={d.imageUrl}
              alt="Layout reference"
              className="w-full h-28 object-cover rounded-[14px] nodrag nopan"
              draggable={false}
            />
            <button
              type="button"
              className="nodrag nopan absolute top-2.5 right-2.5 rounded-lg bg-zinc-900/85 px-2 py-1 text-[10px] font-medium text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
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
              "nodrag nopan w-full h-24 rounded-2xl bg-white/95 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-layout/40",
              dragOver && "ring-2 ring-layout/50 bg-white",
              !dragOver && "hover:bg-white",
              loading && "pointer-events-none opacity-70"
            )}
          >
            {loading ? (
              <p className="text-[11px] text-zinc-500">Carregando…</p>
            ) : (
              <>
                <p className="text-[11px] text-zinc-600 font-medium">Arraste imagem</p>
                <p className="text-[10px] text-zinc-400">ou clique</p>
              </>
            )}
          </div>
        )}
        {error && (
          <p className="text-[10px] text-red-400 leading-snug" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] text-zinc-500">Fidelidade</span>
          <span className="text-[11px] font-medium text-zinc-200">{d.fidelity}%</span>
        </div>
        {isControlNet && (
          <div className="flex items-center gap-1 rounded-lg border border-layout/25 bg-layout/10 px-2 py-1.5">
            <span className="text-[10px] text-layout font-medium">ControlNet · {d.controlType}</span>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={handleProps(HANDLE_COLORS.image, "left")}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="layout-out"
        style={handleProps(HANDLE_COLORS.layout, "right")}
      />
    </NodeShell>
  );
}
