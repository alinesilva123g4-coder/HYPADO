"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Img = { id: string; url: string; position: number };

const UPLOAD_ERRORS: Record<string, string> = {
  no_file: "Nenhum arquivo selecionado.",
  invalid_type: "Formato inválido. Use JPG, PNG, WEBP ou GIF.",
  too_large: "Imagem muito grande (máx. 12MB). Comprima e tente de novo.",
  storage_misconfigured: "Storage não configurado no servidor (falta a chave do Supabase).",
  bucket_create_failed: "Não foi possível criar o bucket de imagens no Supabase.",
  upload_failed: "Falha ao enviar pro Supabase Storage.",
  server_error: "Erro inesperado no servidor.",
};

export function ImageManager({ productId, images: initial }: { productId: string; images: Img[] }) {
  const router = useRouter();
  const [images, setImages] = useState<Img[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const j = await up.json().catch(() => ({}));
          const msg = UPLOAD_ERRORS[j.error] || j.error || "Falha no upload";
          throw new Error(j.detail ? `${msg} (${j.detail})` : msg);
        }
        const { url } = await up.json();
        const r = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!r.ok) throw new Error("Falha ao salvar imagem");
        const img = await r.json();
        setImages((prev) => [...prev, img]);
      }
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Erro");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover essa imagem?")) return;
    const r = await fetch(`/api/admin/products/${productId}/images?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setImages((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id);
    const next = idx + dir;
    if (next < 0 || next >= images.length) return;
    const copy = [...images];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    const reordered = copy.map((i, k) => ({ ...i, position: k }));
    setImages(reordered);
    await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order: reordered.map((i) => i.id) }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {images.map((img, i) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
            <img src={img.url} alt="" className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(img.id, -1)}
                  disabled={i === 0}
                  className="bg-white rounded px-2 py-0.5 text-xs disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(img.id, 1)}
                  disabled={i === images.length - 1}
                  className="bg-white rounded px-2 py-0.5 text-xs disabled:opacity-40"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="bg-white text-red-600 rounded px-2 py-0.5 text-xs"
              >
                ✕
              </button>
            </div>
            {i === 0 && (
              <span className="absolute top-2 left-2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded">
                principal
              </span>
            )}
          </div>
        ))}
        <label
          className={`aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-xs text-neutral-500 cursor-pointer hover:bg-neutral-50 ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <span className="text-2xl">+</span>
          <span>{uploading ? "enviando…" : "adicionar"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
