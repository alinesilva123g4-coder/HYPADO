"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message || "Credenciais inválidas.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-neutral-50 px-4 py-10 overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 14px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.07), transparent)",
        }}
        aria-hidden
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-[400px] bg-white border border-neutral-200 rounded-2xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
      >
        <div className="flex flex-col items-center text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="HYPADO"
            className="h-14 w-auto object-contain"
            style={{ animation: "none" }}
          />
          <div className="mt-4 text-[10px] uppercase tracking-[0.32em] text-neutral-500">
            painel admin
          </div>
          <h1 className="mt-3 text-xl font-semibold text-neutral-900">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        <label
          htmlFor="email"
          className="block text-[10px] font-semibold text-neutral-700 mb-2 uppercase tracking-[0.18em]"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="email"
          placeholder="voce@hypado.com.br"
          className="w-full border border-neutral-300 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all placeholder:text-neutral-300"
        />

        <label
          htmlFor="password"
          className="block text-[10px] font-semibold text-neutral-700 mb-2 mt-5 uppercase tracking-[0.18em]"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full border border-neutral-300 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all placeholder:text-neutral-300"
        />

        {err && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-3.5 w-3.5 mt-0.5 text-red-600 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-xs text-red-700 leading-snug">{err}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="mt-6 w-full bg-neutral-900 text-white text-sm font-medium py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar no painel"
          )}
        </button>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.28em] text-neutral-400">
          acesso restrito · HYPADO
        </p>
      </form>
    </div>
  );
}
