"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Review = {
  id: string;
  rating: number;
  authorName: string;
  city: string | null;
  title: string | null;
  body: string;
  verified: boolean;
  likes: number;
  dislikes: number;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  replies: { id: string; authorName: string; body: string; createdAt: string }[];
};

export function ReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [verified, setVerified] = useState(review.verified);

  async function toggleVerified() {
    const next = !verified;
    setVerified(next);
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verified: next }),
    });
    router.refresh();
  }

  async function sendReply() {
    if (!reply.trim()) return;
    const r = await fetch(`/api/admin/reviews/${review.id}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: reply.trim(), authorName: "HYPADO" }),
    });
    if (r.ok) {
      setReply("");
      router.refresh();
    }
  }

  async function remove() {
    if (!confirm("Excluir avaliação?")) return;
    const r = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  async function deleteReply(id: string) {
    if (!confirm("Excluir resposta?")) return;
    const r = await fetch(`/api/admin/reviews/${review.id}/reply?id=${id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  return (
    <li className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            <span className="font-medium">{review.authorName}</span>
            {review.city && <span className="text-neutral-500 text-xs">· {review.city}</span>}
            {verified && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full">verificado</span>}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            <Link href={`/admin/produtos/${review.product.id}`} className="hover:underline">
              {review.product.name}
            </Link>
            {" · "}
            {new Date(review.createdAt).toLocaleString("pt-BR")}
            {" · "}
            👍 {review.likes} 👎 {review.dislikes}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={toggleVerified}
            className="text-xs border border-neutral-200 rounded-md px-2 py-1 hover:bg-neutral-50"
          >
            {verified ? "Desverificar" : "Verificar"}
          </button>
          <button onClick={remove} className="text-xs text-red-600 hover:underline">
            Excluir
          </button>
        </div>
      </div>

      {review.title && <h3 className="mt-3 font-medium text-sm">{review.title}</h3>}
      <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">{review.body}</p>

      {review.replies.length > 0 && (
        <ul className="mt-3 pl-4 border-l-2 border-neutral-200 space-y-2">
          {review.replies.map((rp) => (
            <li key={rp.id} className="text-sm">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-medium text-neutral-800">{rp.authorName}</span>
                <span>· {new Date(rp.createdAt).toLocaleString("pt-BR")}</span>
                <button onClick={() => deleteReply(rp.id)} className="text-red-600 hover:underline ml-auto">
                  excluir
                </button>
              </div>
              <p className="text-neutral-700 whitespace-pre-wrap">{rp.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Responder como HYPADO…"
          className="flex-1 border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
        />
        <button
          onClick={sendReply}
          disabled={!reply.trim()}
          className="bg-black text-white text-sm px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          Responder
        </button>
      </div>
    </li>
  );
}
