"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";

export type ProductRowData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  active: boolean;
  stock: number;
  reviews: number;
  imageUrl: string | null;
  sales: { qty: number; rev: number } | null;
  views: number;
};

export function ProductRow({ p }: { p: ProductRowData }) {
  const router = useRouter();
  const [active, setActive] = useState(p.active);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  const stockTone =
    p.stock === 0
      ? "text-rose-700 bg-rose-50 border-rose-100"
      : p.stock < 10
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : "text-neutral-700 bg-neutral-50 border-neutral-200";

  async function toggleActive() {
    const next = !active;
    setActive(next); // otimista
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!r.ok) {
        setActive(!next); // reverte
      } else {
        start(() => router.refresh());
      }
    } catch {
      setActive(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={`bg-white border rounded-2xl p-3 flex items-center gap-3 transition-colors ${
        active ? "border-neutral-200" : "border-neutral-200 bg-neutral-50/60"
      }`}
    >
      {/* Thumb */}
      <Link href={`/admin/produtos/${p.id}`} className="shrink-0">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt=""
            className={`w-14 h-14 rounded-xl object-cover bg-neutral-100 border border-neutral-200 ${
              active ? "" : "opacity-50"
            }`}
            style={{ animation: "none" }}
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="1.5" />
              <path d="m21 17-5-5-7 7" />
            </svg>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/admin/produtos/${p.id}`}
          className="font-medium hover:underline block truncate leading-tight"
        >
          {p.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
          <span className="inline-block bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
            {p.category}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border tabular-nums ${stockTone}`}>
            {p.stock} un
          </span>
          {p.reviews > 0 && <span className="text-amber-600">★ {p.reviews}</span>}
          {p.sales && (
            <span className="hidden sm:inline tabular-nums text-emerald-700">
              {p.sales.qty} vend · {formatBRL(p.sales.rev)} (30d)
            </span>
          )}
          {p.views > 0 && (
            <span className="hidden md:inline tabular-nums text-neutral-400">
              {p.views.toLocaleString("pt-BR")} views
            </span>
          )}
        </div>
      </div>

      {/* Preço + toggle */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="font-semibold tabular-nums text-sm md:text-base">{formatBRL(p.priceCents)}</span>
        <button
          type="button"
          onClick={toggleActive}
          disabled={busy || pending}
          aria-pressed={active}
          aria-label={active ? "Desativar produto" : "Ativar produto"}
          title={active ? "Ativo na loja — toque para esconder" : "Escondido — toque para publicar"}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
            active ? "bg-emerald-500" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-[10px] font-medium ${active ? "text-emerald-600" : "text-neutral-400"}`}>
          {active ? "na loja" : "oculto"}
        </span>
      </div>
    </li>
  );
}
