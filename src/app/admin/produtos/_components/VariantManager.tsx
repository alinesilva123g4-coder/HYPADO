"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; size: string; stock: number };

const COMMON_SIZES = ["PP", "P", "M", "G", "GG", "XGG", "38", "39", "40", "41", "42", "43", "44", "ÚNICO"];

export function VariantManager({ productId, variants: initial }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>(initial);
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState("8");
  const [saving, setSaving] = useState<string | null>(null);

  async function updateStock(v: Variant, stock: number) {
    setSaving(v.id);
    setVariants((prev) => prev.map((x) => (x.id === v.id ? { ...x, stock } : x)));
    await fetch(`/api/admin/products/${productId}/variants`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: v.id, stock }),
    });
    setSaving(null);
    router.refresh();
  }

  async function addVariant() {
    if (!newSize.trim()) return;
    const r = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ size: newSize.trim().toUpperCase(), stock: Number(newStock) || 0 }),
    });
    if (r.ok) {
      const v = await r.json();
      setVariants((prev) => [...prev, v].sort((a, b) => a.size.localeCompare(b.size)));
      setNewSize("");
      setNewStock("8");
      router.refresh();
    }
  }

  async function removeVariant(id: string) {
    if (!confirm("Remover este tamanho?")) return;
    const r = await fetch(`/api/admin/products/${productId}/variants?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setVariants((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <ul className="space-y-2 mb-4">
        {variants.map((v) => {
          const tone =
            v.stock === 0
              ? "border-rose-200 bg-rose-50/50"
              : v.stock <= 3
              ? "border-amber-200 bg-amber-50/50"
              : "border-neutral-200 bg-white";
          return (
            <li key={v.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${tone}`}>
              <span className="font-semibold w-14 shrink-0 text-sm">{v.size}</span>

              {/* Stepper touch-friendly */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateStock(v, Math.max(0, v.stock - 1))}
                  className="w-9 h-9 rounded-lg border border-neutral-300 bg-white text-lg leading-none flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                  disabled={v.stock <= 0}
                  aria-label="Diminuir estoque"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={v.stock}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setVariants((prev) => prev.map((x) => (x.id === v.id ? { ...x, stock: isNaN(n) ? 0 : n } : x)));
                  }}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    updateStock(v, isNaN(n) || n < 0 ? 0 : n);
                  }}
                  className="w-14 h-9 text-center border border-neutral-300 rounded-lg text-sm tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => updateStock(v, v.stock + 1)}
                  className="w-9 h-9 rounded-lg border border-neutral-300 bg-white text-lg leading-none flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Aumentar estoque"
                >
                  +
                </button>
              </div>

              <span className="text-[11px] text-neutral-500 flex-1 min-w-0">
                {saving === v.id ? (
                  <span className="text-emerald-600">salvando…</span>
                ) : v.stock === 0 ? (
                  <span className="text-rose-600 font-medium">esgotado</span>
                ) : (
                  "unidades"
                )}
              </span>
              <button
                type="button"
                onClick={() => removeVariant(v.id)}
                className="text-xs text-neutral-400 hover:text-red-600 shrink-0 px-1"
                aria-label="Remover tamanho"
              >
                remover
              </button>
            </li>
          );
        })}
        {variants.length === 0 && <li className="py-2 text-sm text-neutral-500">Nenhum tamanho cadastrado.</li>}
      </ul>

      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="block text-xs text-neutral-600 mb-1">Tamanho</label>
          <input
            list="size-suggestions"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="P, M, 40…"
            className="w-28 border border-neutral-300 rounded-md px-2 py-1.5 text-sm"
          />
          <datalist id="size-suggestions">
            {COMMON_SIZES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-neutral-600 mb-1">Estoque</label>
          <input
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            className="w-24 border border-neutral-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="bg-neutral-900 text-white text-sm px-3 py-1.5 rounded-md"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}
