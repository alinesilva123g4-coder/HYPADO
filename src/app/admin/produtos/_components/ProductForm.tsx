"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceCents: number;
  active: boolean;
};

const CATEGORIES = ["Blusas", "Camisetas", "Calças", "Shorts", "Kits", "Chinelas"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function ProductForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Initial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : ""
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const body = {
      name: name.trim(),
      slug: (slug || slugify(name)).trim(),
      category,
      description: description.trim(),
      priceCents: Math.round(parseFloat(price.replace(",", ".") || "0") * 100),
      active,
    };
    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Erro ao salvar");
      return;
    }
    const j = await r.json();
    if (mode === "create") {
      router.push(`/admin/produtos/${j.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (mode === "create") setSlug(slugify(e.target.value));
            }}
            required
            className="input"
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
            className="input"
          />
        </Field>
        <Field label="Categoria">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Preço">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 pointer-events-none">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="0,00"
              className="input pl-9 font-medium tabular-nums"
            />
          </div>
        </Field>
      </div>

      <Field label="Descrição">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Conte os detalhes do produto: tecido, caimento, medidas…"
          className="input resize-y"
        />
      </Field>

      {/* Toggle ativo */}
      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        className={`w-full flex items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition-colors ${
          active ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-200 bg-neutral-50"
        }`}
      >
        <span>
          <span className="block text-sm font-medium text-neutral-900">
            {active ? "Produto ativo" : "Produto oculto"}
          </span>
          <span className="block text-xs text-neutral-500">
            {active ? "Aparece na loja para os clientes." : "Não aparece na loja."}
          </span>
        </span>
        <span
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            active ? "bg-emerald-500" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>
      )}

      <div className="pt-1 sticky bottom-0 -mx-5 px-5 py-3 bg-gradient-to-t from-white via-white to-white/0 md:static md:bg-none md:p-0">
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-medium px-5 py-3 md:py-2.5 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
              </svg>
              Salvando…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mode === "create" ? <path d="M12 5v14M5 12h14" /> : <path d="M5 13l4 4L19 7" />}
              </svg>
              {mode === "create" ? "Criar produto" : "Salvar alterações"}
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid rgb(212 212 216);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
        :global(.input:focus) {
          outline: none;
          border-color: black;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
