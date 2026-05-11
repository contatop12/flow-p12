// src/components/canvas/PropertiesPanel.tsx
"use client";
import { useCallback, useRef, useState } from "react";
import type { Node } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import type { TextNodeData } from "./nodes/TextNode";
import type { BrandIDNodeData } from "./nodes/BrandIDNode";
import {
  IMAGE_LAYOUT_MAX_FILE_BYTES,
  validateImageLayoutFile,
  type ImageLayoutNodeData,
} from "./nodes/ImageLayoutNode";
import type { GenerateNodeData } from "./nodes/GenerateNode";
import type { OutputNodeData } from "./nodes/OutputNode";

const inputBase =
  "w-full rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

type PanelProps = {
  node: Node | null;
  onChange: (id: string, data: Record<string, unknown>) => void;
  onDeleteNode: (id: string) => void;
};

export function PropertiesPanel({ node, onChange, onDeleteNode }: PanelProps) {
  if (!node) {
    return (
      <aside className="w-[280px] shrink-0 border-l border-white/10 bg-surface flex items-center justify-center">
        <p className="text-xs text-subtle text-center px-4">
          Selecione um nó para editar suas propriedades
        </p>
      </aside>
    );
  }

  function update(patch: Record<string, unknown>) {
    onChange(node!.id, { ...(node!.data as Record<string, unknown>), ...patch });
  }

  return (
    <aside className="w-[280px] shrink-0 border-l border-white/10 bg-surface overflow-y-auto">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs font-semibold text-ink">
          {node.type?.replace("Node", "") ?? "Nó"}
        </p>
        <p className="text-[10px] text-subtle font-mono mt-0.5 break-all">{node.id}</p>
        <button
          type="button"
          onClick={() => onDeleteNode(node.id)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-1.5 text-[11px] font-medium text-red-300 hover:bg-red-950/40 hover:border-red-500/40 transition-colors"
        >
          <Trash2 className="size-3.5 shrink-0 opacity-90" aria-hidden />
          Remover nó
        </button>
        <p className="mt-2 text-[10px] text-subtle leading-snug">
          Ou selecione o nó no canvas e pressione Delete / Backspace.
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {node.type === "TextNode" && (
          <TextPanel data={node.data as TextNodeData} update={update} />
        )}
        {node.type === "BrandIDNode" && (
          <BrandPanel data={node.data as BrandIDNodeData} update={update} />
        )}
        {node.type === "ImageLayoutNode" && (
          <LayoutPanel data={node.data as ImageLayoutNodeData} update={update} />
        )}
        {node.type === "GenerateNode" && (
          <GeneratePanel data={node.data as GenerateNodeData} update={update} />
        )}
        {node.type === "OutputNode" && (
          <OutputPanel data={node.data as OutputNodeData} update={update} />
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextPanel({ data, update }: { data: TextNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Prompt principal">
        <textarea
          value={data.mainPrompt}
          onChange={(e) => update({ mainPrompt: e.target.value })}
          rows={4}
          className={`${inputBase} resize-none`}
          placeholder="Descreva a imagem…"
        />
      </Field>
      <Field label="Headline">
        <input
          type="text"
          value={data.headline ?? ""}
          onChange={(e) => update({ headline: e.target.value })}
          className={inputBase}
          placeholder="Promoção Insana"
        />
      </Field>
      <Field label="Subhead">
        <input
          type="text"
          value={data.subhead ?? ""}
          onChange={(e) => update({ subhead: e.target.value })}
          className={inputBase}
          placeholder="Toda pizza pela metade…"
        />
      </Field>
      <Field label="CTA">
        <input
          type="text"
          value={data.cta ?? ""}
          onChange={(e) => update({ cta: e.target.value })}
          className={inputBase}
          placeholder="Peça já"
        />
      </Field>
      <Field label="Disclaimer">
        <input
          type="text"
          value={data.disclaimer ?? ""}
          onChange={(e) => update({ disclaimer: e.target.value })}
          className={inputBase}
          placeholder="Válido até 15/05"
        />
      </Field>
    </>
  );
}

function BrandPanel({ data }: { data: BrandIDNodeData; update: (p: Record<string, unknown>) => void }) {
  const bp = data.brandPayload;
  return (
    <>
      <Field label="Cliente">
        <p className="text-xs text-muted">
          {bp?.clientName ?? "Nenhum cliente selecionado"}{" "}
          <span className="text-[10px] text-subtle">(selecione no dropdown do nó)</span>
        </p>
      </Field>
      {bp && (
        <Field label="Injetar na geração">
          <div className="space-y-2">
            {(["applyPalette", "applyTypography", "applyBrandTone", "applyArtRefs"] as const).map((key) => {
              const labels: Record<string, string> = {
                applyPalette: "Paleta de cores",
                applyTypography: "Tipografia",
                applyBrandTone: "Tom visual",
                applyArtRefs: "Referências de estilo",
              };
              return (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bp.toggles[key]}
                    readOnly
                    className="rounded border-white/20 bg-surface-2"
                  />
                  <span className="text-xs text-muted">{labels[key]}</span>
                </label>
              );
            })}
          </div>
        </Field>
      )}
    </>
  );
}

function LayoutPanel({ data, update }: { data: ImageLayoutNodeData; update: (p: Record<string, unknown>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  const onLayoutImageSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setImgError(null);
      const validation = validateImageLayoutFile(file);
      if (validation) {
        setImgError(validation);
        return;
      }
      setImgLoading(true);
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Leitura inválida."));
          };
          reader.onerror = () =>
            reject(new Error(reader.error?.message ?? "Falha ao ler o arquivo."));
          reader.readAsDataURL(file);
        });
        update({ imageUrl: url });
      } catch (err) {
        setImgError(err instanceof Error ? err.message : "Não foi possível carregar a imagem.");
      } finally {
        setImgLoading(false);
      }
    },
    [update]
  );

  const maxMb = IMAGE_LAYOUT_MAX_FILE_BYTES / (1024 * 1024);

  return (
    <>
      <Field label="Imagem de referência">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={onLayoutImageSelected}
        />
        {data.imageUrl ? (
          <div className="space-y-2">
            <img
              src={data.imageUrl}
              alt="Referência"
              className="w-full max-h-32 object-contain rounded-lg border border-white/10 bg-bg"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={imgLoading}
                className="text-xs rounded-lg border border-white/15 px-3 py-1.5 text-ink hover:bg-surface-2 disabled:opacity-50"
              >
                {imgLoading ? "Carregando…" : "Substituir"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImgError(null);
                  update({ imageUrl: undefined });
                }}
                className="text-xs rounded-lg border border-red-500/40 px-3 py-1.5 text-red-400 hover:bg-red-950/40"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={imgLoading}
            className="w-full text-xs rounded-lg border border-dashed border-white/15 px-3 py-3 text-muted hover:bg-surface-2 disabled:opacity-50"
          >
            {imgLoading ? "Carregando…" : "Escolher arquivo (JPEG, PNG, WebP, GIF)"}
          </button>
        )}
        <p className="text-[10px] text-subtle mt-1">Tamanho máximo aproximado: {maxMb} MB.</p>
        {imgError && (
          <p className="text-[10px] text-red-400 mt-1" role="alert">
            {imgError}
          </p>
        )}
      </Field>
      <Field label={`Fidelidade: ${data.fidelity}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={data.fidelity}
          onChange={(e) => update({ fidelity: Number(e.target.value) })}
          className="w-full accent-accent"
        />
        <p className="text-[10px] text-muted mt-1">
          {data.fidelity <= 20 && "Influência mínima — inspiração distante."}
          {data.fidelity > 20 && data.fidelity <= 50 && "Influência moderada — pipeline inspiração."}
          {data.fidelity > 50 && data.fidelity <= 80 && "Influência significativa — ControlNet ativo."}
          {data.fidelity > 80 && "Cópia estrutural quase exata — ControlNet máximo."}
        </p>
      </Field>
      <Field label="Modo técnico">
        <select
          value={data.techMode}
          onChange={(e) => update({ techMode: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="auto">Automático (recomendado)</option>
          <option value="force_inspiration">Forçar inspiração</option>
          <option value="force_strict">Forçar rígido (ControlNet)</option>
        </select>
      </Field>
      <Field label="Tipo de estrutura (se rígido)">
        <select
          value={data.controlType}
          onChange={(e) => update({ controlType: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="depth">Profundidade (Depth)</option>
          <option value="canny">Bordas (Canny)</option>
          <option value="mlsd">Linhas (MLSD)</option>
          <option value="openpose">Pose (OpenPose)</option>
        </select>
      </Field>
    </>
  );
}

function OutputPanel({ data, update }: { data: OutputNodeData; update: (p: Record<string, unknown>) => void }) {
  const provider = data.preferredProvider ?? "gpt-image-2";
  const aspect = data.aspectRatio ?? "1:1";
  return (
    <>
      <p className="text-xs text-muted leading-relaxed">
        O resultado aparece no cartão após gerar. Ligue Text (obrigatório), Brand ID e Image-Layout ao Output.
      </p>
      <Field label="Provider">
        <select
          value={provider}
          onChange={(e) => update({ preferredProvider: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="gpt-image-2">GPT-Image 2</option>
          <option value="nano-banana-2">Nano Banana 2</option>
          <option value="luma">Luma UNI-1.1</option>
        </select>
      </Field>
      <Field label="Aspect ratio">
        <select
          value={aspect}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="1:1">1:1 (Quadrado)</option>
          <option value="16:9">16:9 (Paisagem)</option>
          <option value="9:16">9:16 (Retrato)</option>
          <option value="4:3">4:3</option>
        </select>
      </Field>
    </>
  );
}

function GeneratePanel({ data, update }: { data: GenerateNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <p className="text-[10px] text-amber-400/90">
        Nó legado. Prefira o Output com ligações diretas dos nós de dados.
      </p>
      <Field label="Provider">
        <select
          value={data.preferredProvider ?? "gpt-image-2"}
          onChange={(e) => update({ preferredProvider: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="gpt-image-2">GPT-Image 2</option>
          <option value="nano-banana-2">Nano Banana 2</option>
          <option value="luma">Luma UNI-1.1</option>
        </select>
      </Field>
      <Field label="Aspect ratio">
        <select
          value={data.aspectRatio ?? "1:1"}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className={`${inputBase} bg-surface`}
        >
          <option value="1:1">1:1 (Quadrado)</option>
          <option value="16:9">16:9 (Paisagem)</option>
          <option value="9:16">9:16 (Retrato)</option>
          <option value="4:3">4:3</option>
        </select>
      </Field>
    </>
  );
}
