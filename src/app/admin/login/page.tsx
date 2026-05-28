"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!r.ok) {
      setErr("Senha incorreta.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 px-4 relative overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50"
        style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.06), transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.05), transparent)" }}
        aria-hidden
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-8 shadow-xl shadow-black/[0.03]"
      >
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="HYPADO"
            className="h-16 w-auto object-contain"
            style={{ animation: "none" }}
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            painel admin
          </div>
        </div>

        <label className="block text-xs font-medium text-neutral-700 mb-2 uppercase tracking-[0.15em]">
          Senha
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="••••••••"
            className="w-full border border-neutral-300 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 transition-all placeholder:text-neutral-300"
          />
        </div>
        {err && (
          <p className="text-xs text-red-600 mt-2.5 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 w-full bg-neutral-900 text-white text-sm font-medium py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 active:scale-[0.99] transition-all"
        >
          {loading ? "Entrando…" : "Entrar no painel"}
        </button>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          acesso restrito · HYPADO
        </p>
      </form>
    </div>
  );
}
