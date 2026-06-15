"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function del() {
    if (!confirm("Excluir produto definitivamente? Essa ação não pode ser desfeita.")) return;
    setErr(null);
    setLoading(true);
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setLoading(false);
    if (r.ok) {
      router.push("/admin/produtos");
      router.refresh();
      return;
    }
    const j = await r.json().catch(() => ({}));
    if (j.error === "tem_pedidos") {
      setErr(
        "Esse produto já tem pedidos no histórico, então não pode ser excluído. " +
          'Use o campo "Produto ativo" acima e desmarque pra escondê-lo da loja.',
      );
    } else if (j.error === "nao_encontrado") {
      setErr("Produto não encontrado (talvez já tenha sido removido).");
    } else {
      setErr("Não foi possível excluir agora. Tente de novo em instantes.");
    }
  }

  async function deactivate() {
    setErr(null);
    setLoading(true);
    const r = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    setLoading(false);
    if (r.ok) {
      router.refresh();
    } else {
      setErr("Não foi possível desativar agora. Tente de novo.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={del}
        disabled={loading}
        className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-50"
      >
        {loading ? "Processando…" : "Excluir"}
      </button>
      {err && (
        <div className="max-w-xs text-right rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          {err}
          {err.includes("pedidos") && (
            <button
              onClick={deactivate}
              disabled={loading}
              className="mt-1.5 block ml-auto text-amber-900 font-medium underline underline-offset-2 disabled:opacity-50"
            >
              Desativar agora
            </button>
          )}
        </div>
      )}
    </div>
  );
}
