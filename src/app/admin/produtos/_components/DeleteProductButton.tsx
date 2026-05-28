"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function del() {
    if (!confirm("Excluir produto definitivamente? Essa ação não pode ser desfeita.")) return;
    setLoading(true);
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setLoading(false);
    if (r.ok) {
      router.push("/admin/produtos");
      router.refresh();
    }
  }
  return (
    <button
      onClick={del}
      disabled={loading}
      className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-50"
    >
      {loading ? "Excluindo…" : "Excluir"}
    </button>
  );
}
