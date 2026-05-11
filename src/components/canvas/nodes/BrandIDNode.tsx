"use client";

import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { BadgeCheck } from "lucide-react";
import type { BrandPayload } from "@/types";
import { NodeShell, NodeCardHeader } from "./NodeShell";
import { HANDLE_COLORS, handleProps } from "./canvasHandleStyles";

interface ClientOption {
  id: string;
  name: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
}

export interface BrandIDNodeData extends Record<string, unknown> {
  label?: string;
  brandPayload?: BrandPayload;
}

export function BrandIDNode({ id, data, selected }: NodeProps) {
  const nodeData = data as BrandIDNodeData;
  const { updateNodeData } = useReactFlow();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    nodeData.brandPayload?.clientId ?? ""
  );

  const [toggles, setToggles] = useState({
    applyPalette: nodeData.brandPayload?.toggles?.applyPalette ?? true,
    applyTypography: nodeData.brandPayload?.toggles?.applyTypography ?? true,
    applyBrandTone: nodeData.brandPayload?.toggles?.applyBrandTone ?? true,
    applyArtRefs: nodeData.brandPayload?.toggles?.applyArtRefs ?? false,
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((res: { clients: ClientOption[] }) => {
        setClients(res.clients);
        setLoadingClients(false);
      })
      .catch(() => setLoadingClients(false));
  }, []);

  function updatePayload(clientId: string, newToggles: typeof toggles) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      updateNodeData(id, { brandPayload: undefined });
      return;
    }
    const payload: BrandPayload = {
      clientId: client.id,
      clientName: client.name,
      toggles: newToggles,
      palette: client.palette,
      typography: client.typography,
      brandTone: client.brandTone,
    };
    updateNodeData(id, { brandPayload: payload });
  }

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    updatePayload(clientId, toggles);
  }

  function handleToggle(key: keyof typeof toggles) {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    updatePayload(selectedClientId, newToggles);
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <NodeShell selected={selected} className="w-56">
      <NodeCardHeader title={nodeData.label ?? "Brand ID"} icon={BadgeCheck} />
      <div className="px-3.5 pb-3.5 pt-0.5 space-y-2">
        <div className="rounded-xl bg-black/30 p-2.5">
          <select
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            disabled={loadingClients}
            className="nodrag nopan w-full rounded-lg border border-white/[0.06] bg-[#141414] px-2.5 py-2 text-[12px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand/35"
          >
            <option value="">{loadingClients ? "Carregando…" : "Selecione um cliente"}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="mt-2.5 space-y-1.5">
              {(["applyBrandTone", "applyPalette", "applyTypography"] as const).map((key) => {
                const labels: Record<string, string> = {
                  applyBrandTone: "Tom",
                  applyPalette: "Paleta",
                  applyTypography: "Tipografia",
                };
                return (
                  <label key={key} className="flex items-center gap-2 cursor-pointer nodrag">
                    <input
                      type="checkbox"
                      checked={toggles[key]}
                      onChange={() => handleToggle(key)}
                      className="rounded border-white/20 bg-[#141414] accent-brand"
                    />
                    <span className="text-[12px] text-zinc-400">{labels[key]}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="brand-out"
        style={handleProps(HANDLE_COLORS.brand, "right")}
      />
    </NodeShell>
  );
}
