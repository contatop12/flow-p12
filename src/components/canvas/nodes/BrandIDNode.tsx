"use client";

import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { BrandPayload } from "@/types";

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
    <div
      className={`w-52 rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-[#a855f7]" : ""
      }`}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-[#a855f7] bg-purple-50 px-1.5 py-0.5 rounded">brand</span>
          <span className="text-xs font-medium text-[#18181B] truncate">
            {nodeData.label ?? "Brand ID"}
          </span>
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => handleClientChange(e.target.value)}
          disabled={loadingClients}
          className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E5E2DB] bg-white text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#a855f7] mb-2"
        >
          <option value="">{loadingClients ? "Carregando…" : "Selecione um cliente"}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedClient && (
          <div className="space-y-1">
            {(["applyBrandTone", "applyPalette", "applyTypography"] as const).map((key) => {
              const labels: Record<string, string> = {
                applyBrandTone: "Tom",
                applyPalette: "Paleta",
                applyTypography: "Tipografia",
              };
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={() => handleToggle(key)}
                    className="rounded border-[#E5E2DB] accent-[#a855f7]"
                  />
                  <span className="text-[11px] text-[#71717A]">{labels[key]}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="brand-out"
        style={{ background: "#a855f7", width: 10, height: 10 }}
      />
    </div>
  );
}
