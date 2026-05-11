"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha no login");
        return;
      }
      router.push(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-8">
        <div className="w-8 h-8 rounded-lg bg-[#18181B] flex items-center justify-center mb-6 lg:hidden">
          <span className="text-white text-xs font-bold tracking-widest">F</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Bom dia</h1>
        <p className="mt-1 text-sm text-muted">Entre na sua conta Flow P12</p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">E-mail</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            placeholder="voce@empresa.com"
            className="w-full rounded-lg border border-white/10 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-150"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Senha</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-150"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white active:opacity-90 disabled:opacity-40 transition-colors duration-150 mt-2"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
