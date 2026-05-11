import type { Edge, Node } from "@xyflow/react";
import type { BrandPayload, LayoutPayload, TextPayload } from "@/types";
import type { TextNodeData } from "@/components/canvas/nodes/TextNode";
import type { BrandIDNodeData } from "@/components/canvas/nodes/BrandIDNode";
import type { ImageLayoutNodeData } from "@/components/canvas/nodes/ImageLayoutNode";

export type ResolvedGenerationInputs = {
  textPayload: TextPayload | null;
  brandPayload: BrandPayload | undefined;
  layoutPayload: LayoutPayload | undefined;
  resolutionError: string | null;
};

/**
 * Lê arestas incidentes no nó Output e monta o payload para /api/generate.
 * Vários nós do mesmo tipo: prevalece a última aresta encontrada na ordem do array `edges`.
 */
export function resolveGenerationInputs(
  outputNodeId: string,
  nodes: Node[],
  edges: Edge[]
): ResolvedGenerationInputs {
  let textPayload: TextPayload | null = null;
  let brandPayload: BrandPayload | undefined;
  let layoutPayload: LayoutPayload | undefined;

  const inbound = edges.filter((e) => e.target === outputNodeId);

  for (const edge of inbound) {
    const src = nodes.find((n) => n.id === edge.source);
    if (!src?.type) continue;

    const targetHandle = edge.targetHandle ?? "";

    if (targetHandle === "text-in" && src.type === "TextNode") {
      const d = src.data as TextNodeData;
      textPayload = {
        mainPrompt: d.mainPrompt ?? "",
        headline: d.headline,
        subhead: d.subhead,
        cta: d.cta,
        disclaimer: d.disclaimer,
      };
    }

    if (targetHandle === "brand-in" && src.type === "BrandIDNode") {
      const d = src.data as BrandIDNodeData;
      if (d.brandPayload) brandPayload = d.brandPayload;
    }

    if (targetHandle === "layout-in" && src.type === "ImageLayoutNode") {
      const d = src.data as ImageLayoutNodeData;
      const url = d.imageUrl?.trim();
      if (url) {
        layoutPayload = {
          image: url,
          fidelity: d.fidelity,
          techMode: d.techMode,
          controlType: d.controlType,
        };
      }
    }
  }

  if (!textPayload?.mainPrompt?.trim()) {
    return {
      textPayload: null,
      brandPayload,
      layoutPayload,
      resolutionError:
        "Conecte um nó Text a este Output (handle de texto) e preencha o prompt.",
    };
  }

  return {
    textPayload,
    brandPayload,
    layoutPayload,
    resolutionError: null,
  };
}
