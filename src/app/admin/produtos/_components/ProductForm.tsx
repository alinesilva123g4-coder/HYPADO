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

const CATEGORIES = ["Blusas", "Camisetas", "Shorts", "Kits", "Chinelas"];

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
        <Field label="Preço (R$)">
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="0,00"
            className="input"
          />
        </Field>
      </div>

      <Field label="Descrição">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="input resize-y"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span>Produto ativo (visível na loja)</span>
      </label>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Salvando…" : mode === "create" ? "Criar produto" : "Salvar alterações"}
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
