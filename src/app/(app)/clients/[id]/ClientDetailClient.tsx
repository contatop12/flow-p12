"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ClientData {
  id: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
  createdAt: number;
  updatedAt: number;
}

export function ClientDetailClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [primaryFont, setPrimaryFont] = useState("");
  const [secondaryFont, setSecondaryFont] = useState("");
  const [paletteInput, setPaletteInput] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((data: ClientData) => {
        setClient(data);
        setName(data.name);
        setBrandTone(data.brandTone ?? "");
        setPrimaryFont(data.typography?.primary ?? "");
        setSecondaryFont(data.typography?.secondary ?? "");
        setPaletteInput(data.palette?.join(", ") ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaveMsg(null);

    const palette = paletteInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const body: Record<string, unknown> = { name };
    if (brandTone) body.brandTone = brandTone;
    if (palette.length > 0) body.palette = palette;
    if (primaryFont || secondaryFont) {
      body.typography = { primary: primaryFont, secondary: secondaryFont };
    }

    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erro ao salvar");
    } else {
      setSaveMsg("Salvo!");
      setTimeout(() => setSaveMsg(null), 2000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Excluir o cliente "${client?.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/clients");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    const res = await fetch(`/api/clients/${clientId}/logo`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erro ao fazer upload do logo");
    } else {
      const data = (await res.json()) as { r2Key: string };
      setClient((prev) => prev ? { ...prev, logoR2Key: data.r2Key } : prev);
    }
    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return <div className="p-8 text-sm text-subtle">Carregando...</div>;
  if (!client) return <div className="p-8 text-sm text-red-400">Cliente não encontrado.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          ← Clientes
        </button>
        <span className="text-white/15">/</span>
        <h1 className="text-xl font-semibold text-ink tracking-tight">{client.name}</h1>
      </div>

      <div className="mb-6 bg-surface rounded-xl border border-white/10 p-4">
        <p className="text-sm font-medium text-ink mb-3">Logo</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-white/10 bg-surface-2 overflow-hidden flex items-center justify-center">
            {client.logoR2Key ? (
              <img
                src={`/api/clients/${clientId}/logo/serve?t=${client.logoR2Key}`}
                alt={client.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-subtle">{client.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-3 py-1.5 text-xs font-medium border border-white/15 rounded-lg hover:bg-surface-2 disabled:opacity-50 transition-colors text-ink"
            >
              {uploadingLogo ? "Enviando…" : "Trocar logo"}
            </button>
            <p className="mt-1 text-[11px] text-subtle">PNG, JPG, WebP ou SVG. Máx 5 MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-surface rounded-xl border border-white/10 p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent/40 text-ink"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Tom de marca</label>
          <textarea
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            rows={3}
            placeholder="Ex: Bold and modern, com personalidade vibrante..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent/40 text-ink resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Fonte primária</label>
            <input
              type="text"
              value={primaryFont}
              onChange={(e) => setPrimaryFont(e.target.value)}
              placeholder="Ex: Helvetica Neue"
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent/40 text-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Fonte secundária</label>
            <input
              type="text"
              value={secondaryFont}
              onChange={(e) => setSecondaryFont(e.target.value)}
              placeholder="Ex: Georgia"
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent/40 text-ink"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Paleta de cores
            <span className="font-normal ml-1 text-subtle">(hex separados por vírgula)</span>
          </label>
          <input
            type="text"
            value={paletteInput}
            onChange={(e) => setPaletteInput(e.target.value)}
            placeholder="#FF0000, #00FF00, #0000FF"
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent/40 text-ink font-mono"
          />
          {paletteInput && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {paletteInput
                .split(",")
                .map((c) => c.trim())
                .filter((c) => c.match(/^#[0-9a-fA-F]{3,6}$/))
                .map((color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded border border-white/15"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {saveMsg && <p className="text-xs text-accent">{saveMsg}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs text-red-400 border border-red-500/40 rounded-lg hover:bg-red-950/40 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Excluindo…" : "Excluir cliente"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
