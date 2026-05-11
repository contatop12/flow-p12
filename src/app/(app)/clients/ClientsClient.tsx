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
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { clients: ClientRow[] };
    setClients(data.clients);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

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
    return <div className="text-sm text-subtle">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted">
          {clients.length} cliente{clients.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="px-4 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-colors"
        >
          {formOpen ? "Cancelar" : "Novo cliente"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1">Nome do cliente</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Acme Corp"
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 text-sm font-medium bg-accent text-zinc-950 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? "Criando…" : "Criar"}
          </button>
        </form>
      )}
      {error && formOpen && <p className="mb-4 text-xs text-red-400">{error}</p>}

      {clients.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm text-subtle">Nenhum cliente cadastrado.</p>
          <p className="mt-1 text-xs text-subtle">Clique em &quot;Novo cliente&quot; para começar.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-white/10 divide-y divide-white/10">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {client.logoR2Key ? (
                  <img
                    src={`/api/clients/${client.id}/logo/serve`}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-subtle">{client.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{client.name}</p>
                {client.brandTone && (
                  <p className="text-xs text-muted truncate">{client.brandTone}</p>
                )}
              </div>
              {client.palette && client.palette.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {client.palette.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded-full border border-white/15"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-subtle shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
