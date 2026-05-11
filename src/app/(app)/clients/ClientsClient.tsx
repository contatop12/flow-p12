"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  brandTone?: string;
  createdAt: number;
  updatedAt: number;
}

export function ClientsClient() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    const res = await fetch("/api/clients");
    if (!res.ok) return;
    const data = (await res.json()) as { clients: ClientRow[] };
    setClients(data.clients);
    setLoading(false);
  }

  useEffect(() => { loadClients(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Erro ao criar cliente");
      setCreating(false);
      return;
    }
    setNewName("");
    setFormOpen(false);
    await loadClients();
    setCreating(false);
  }

  if (loading) {
    return <div className="text-sm text-[#A1A1AA]">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[#71717A]">{clients.length} cliente{clients.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="px-4 py-2 text-sm font-medium bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
        >
          {formOpen ? "Cancelar" : "Novo cliente"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#71717A] mb-1">Nome do cliente</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Acme Corp"
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E2DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#18181B]"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 text-sm font-medium bg-[#0D9488] text-white rounded-lg hover:bg-[#0f766e] disabled:opacity-50 transition-colors"
          >
            {creating ? "Criando…" : "Criar"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-[#A1A1AA]">Nenhum cliente cadastrado.</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Clique em "Novo cliente" para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E2DB] divide-y divide-[#E5E2DB]">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-[#F5F4F1] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F4F1] border border-[#E5E2DB] flex items-center justify-center shrink-0 overflow-hidden">
                {client.logoR2Key ? (
                  <img src={`/api/clients/${client.id}/logo/serve`} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#A1A1AA]">{client.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#18181B] truncate">{client.name}</p>
                {client.brandTone && (
                  <p className="text-xs text-[#71717A] truncate">{client.brandTone}</p>
                )}
              </div>
              {client.palette && client.palette.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {client.palette.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded-full border border-[#E5E2DB]"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-[#A1A1AA] shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
