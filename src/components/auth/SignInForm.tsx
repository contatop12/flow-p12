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
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-2xl"
    >
      <div>
        <h1 className="text-xl font-semibold text-white">Entrar</h1>
        <p className="mt-1 text-sm text-gray-400">Flow P12 — acesso interno</p>
      </div>
      {error ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-300">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none ring-purple-500 focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-300">Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none ring-purple-500 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
