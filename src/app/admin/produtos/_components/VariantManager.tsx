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
      <ul className="divide-y divide-neutral-100 mb-4">
        {variants.map((v) => (
          <li key={v.id} className="py-2.5 flex items-center gap-3">
            <span className="font-medium w-16">{v.size}</span>
            <input
              type="number"
              min={0}
              defaultValue={v.stock}
              onBlur={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n !== v.stock) updateStock(v, n);
              }}
              className="w-24 border border-neutral-300 rounded-md px-2 py-1 text-sm"
            />
            <span className="text-xs text-neutral-500 flex-1">
              {saving === v.id ? "salvando…" : "unidades"}
            </span>
            <button
              type="button"
              onClick={() => removeVariant(v.id)}
              className="text-xs text-neutral-500 hover:text-red-600"
            >
              remover
            </button>
          </li>
        ))}
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
