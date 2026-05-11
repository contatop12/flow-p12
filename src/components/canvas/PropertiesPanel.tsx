// src/components/canvas/PropertiesPanel.tsx
"use client";
import type { Node } from "@xyflow/react";
import type { TextNodeData } from "./nodes/TextNode";
import type { BrandIDNodeData } from "./nodes/BrandIDNode";
import type { ImageLayoutNodeData } from "./nodes/ImageLayoutNode";
import type { GenerateNodeData } from "./nodes/GenerateNode";

type PanelProps = {
  node: Node | null;
  onChange: (id: string, data: Record<string, unknown>) => void;
};

export function PropertiesPanel({ node, onChange }: PanelProps) {
  if (!node) {
    return (
      <aside className="w-[280px] shrink-0 border-l bg-white flex items-center justify-center">
        <p className="text-xs text-[#A1A1AA] text-center px-4">
          Selecione um nó para editar suas propriedades
        </p>
      </aside>
    );
  }

  function update(patch: Record<string, unknown>) {
    onChange(node!.id, { ...(node!.data as Record<string, unknown>), ...patch });
  }

  return (
    <aside className="w-[280px] shrink-0 border-l bg-white overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-semibold text-[#18181B]">{node.type?.replace("Node", "") ?? "Nó"}</p>
        <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">{node.id}</p>
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
          <p className="text-xs text-[#71717A]">Nó de saída — sem configurações.</p>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#52525B] uppercase tracking-wider mb-1">
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
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all resize-none"
          placeholder="Descreva a imagem…"
        />
      </Field>
      <Field label="Headline">
        <input type="text" value={data.headline ?? ""} onChange={(e) => update({ headline: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Promoção Insana" />
      </Field>
      <Field label="Subhead">
        <input type="text" value={data.subhead ?? ""} onChange={(e) => update({ subhead: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Toda pizza pela metade…" />
      </Field>
      <Field label="CTA">
        <input type="text" value={data.cta ?? ""} onChange={(e) => update({ cta: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Peça já" />
      </Field>
      <Field label="Disclaimer">
        <input type="text" value={data.disclaimer ?? ""} onChange={(e) => update({ disclaimer: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 transition-all"
          placeholder="Válido até 15/05" />
      </Field>
    </>
  );
}

function BrandPanel({ data }: { data: BrandIDNodeData; update: (p: Record<string, unknown>) => void }) {
  const bp = data.brandPayload;
  return (
    <>
      <Field label="Cliente">
        <p className="text-xs text-[#71717A]">
          {bp?.clientName ?? "Nenhum cliente selecionado"}
          {" "}
          <span className="text-[10px] text-[#A1A1AA]">(selecione no dropdown do nó)</span>
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
                    className="rounded border-[#E5E2DB]"
                  />
                  <span className="text-xs text-[#52525B]">{labels[key]}</span>
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
  return (
    <>
      <Field label={`Fidelidade: ${data.fidelity}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={data.fidelity}
          onChange={(e) => update({ fidelity: Number(e.target.value) })}
          className="w-full accent-[#18181B]"
        />
        <p className="text-[10px] text-[#71717A] mt-1">
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
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
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
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
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

function GeneratePanel({ data, update }: { data: GenerateNodeData; update: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Provider">
        <select
          value={data.preferredProvider}
          onChange={(e) => update({ preferredProvider: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
        >
          <option value="gpt-image-2">GPT-Image 2</option>
          <option value="nano-banana-2">Nano Banana 2</option>
          <option value="luma">Luma UNI-1.1</option>
        </select>
      </Field>
      <Field label="Aspect ratio">
        <select
          value={data.aspectRatio}
          onChange={(e) => update({ aspectRatio: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-xs text-[#18181B] outline-none bg-white"
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
