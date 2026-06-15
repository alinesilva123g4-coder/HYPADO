"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { StarRating } from "./StarRating";
import { StarInput } from "./StarInput";
import { getSessionId } from "@/lib/session";

type ReviewMedia = { url: string; type: "image" | "video" };
type Reply = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string | Date;
};

type Review = {
  id: string;
  rating: number;
  authorName: string;
  city: string | null;
  title: string | null;
  body: string;
  verified: boolean;
  media: string | null;
  likes: number;
  dislikes: number;
  createdAt: string | Date;
  replies?: Reply[];
};

type Props = {
  productId: string;
  productName: string;
  initialReviews: Review[];
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function parseMedia(raw: string | null): ReviewMedia[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function Reviews({ productId, productName, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [sort, setSort] = useState<"recent" | "best" | "worst">("recent");
  const [showAll, setShowAll] = useState(false);
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike" | null>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hypado:reactions:v1");
      if (saved) setReactions(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hypado:reactions:v1", JSON.stringify(reactions));
    } catch {}
  }, [reactions]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      dist[r.rating - 1]++;
      sum += r.rating;
    }
    return { avg: sum / reviews.length, count: reviews.length, dist };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sort === "recent") {
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "best") {
      copy.sort(
        (a, b) =>
          b.rating - a.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      copy.sort(
        (a, b) =>
          a.rating - b.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return copy;
  }, [reviews, sort]);

  const visible = showAll ? sortedReviews : sortedReviews.slice(0, 4);

  function updateReview(id: string, patch: Partial<Review>) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function react(reviewId: string, kind: "like" | "dislike") {
    const sessionId = getSessionId();
    // optimistic
    const current = reactions[reviewId] ?? null;
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    let likes = review.likes;
    let dislikes = review.dislikes;
    let next: "like" | "dislike" | null = kind;

    if (current === kind) {
      next = null;
      if (kind === "like") likes -= 1;
      else dislikes -= 1;
    } else if (current === null) {
      if (kind === "like") likes += 1;
      else dislikes += 1;
    } else {
      if (kind === "like") {
        likes += 1;
        dislikes -= 1;
      } else {
        dislikes += 1;
        likes -= 1;
      }
    }

    setReactions((r) => ({ ...r, [reviewId]: next }));
    updateReview(reviewId, { likes, dislikes });

    try {
      const res = await fetch(`/api/reviews/${reviewId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, sessionId }),
      });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setReactions((r) => ({ ...r, [reviewId]: data.myReaction }));
      updateReview(reviewId, { likes: data.likes, dislikes: data.dislikes });
    } catch {
      // rollback
      setReactions((r) => ({ ...r, [reviewId]: current }));
      updateReview(reviewId, { likes: review.likes, dislikes: review.dislikes });
    }
  }

  const isEmpty = reviews.length === 0;

  return (
    <section className="theme-invert relative isolate overflow-hidden border-t border-line bg-background text-foreground">
      {/* Ambiência do fundo — profundidade + textura + marca suave */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Brilho radial no topo — tira o "preto chapado" e cria foco */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(115% 75% at 50% -8%, rgba(255,255,255,0.08), transparent 55%)",
          }}
        />
        {/* Grade fina de pontos — textura discreta, esmaecida nas bordas */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(85% 65% at 50% 38%, #000 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(85% 65% at 50% 38%, #000 0%, transparent 78%)",
          }}
        />
        {/* Marca d'água centralizada e suavizada com máscara (não fica cortada) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mark.png"
          alt=""
          style={{
            animation: "none",
            maskImage: "radial-gradient(closest-side, #000 40%, transparent)",
            WebkitMaskImage:
              "radial-gradient(closest-side, #000 40%, transparent)",
          }}
          className="absolute left-1/2 top-1/2 w-[150%] md:w-[85%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.03] [filter:brightness(0)_invert(1)]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
        {!isEmpty && (
          <h2 className="text-2xl md:text-4xl font-medium leading-[1.05] tracking-tight">
            O que a galera tá falando
          </h2>
        )}

        {/* Stats/invite + always-visible compact form */}
        <div className={`grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-10 items-start ${isEmpty ? "" : "mt-6"}`}>
          {isEmpty ? (
            <div className="text-center lg:text-left">
              <h3 className="gothic text-4xl md:text-5xl leading-[0.92] tracking-tight">
                Conta como<br />ficou em você.
              </h3>
              <p className="mt-4 text-sm md:text-base text-foreground/75 leading-relaxed max-w-md mx-auto lg:mx-0">
                Tira uma foto, grava um vídeo curto, escreve duas linhas.
                Sua palavra ajuda a próxima pessoa a confiar na marca.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-3">
                <div className="gothic text-5xl md:text-6xl leading-none">
                  {stats.avg.toFixed(1)}
                </div>
                <div className="text-xs text-muted">de 5</div>
              </div>
              <StarRating rating={stats.avg} size="md" className="mt-2" />
              <div className="mt-1.5 text-xs text-muted">
                {stats.count} {stats.count === 1 ? "avaliação" : "avaliações"}
              </div>
              <div className="mt-4 space-y-1 max-w-xs">
                {[5, 4, 3, 2, 1].map((star) => {
                  const c = stats.dist[star - 1];
                  const pct = stats.count > 0 ? (c / stats.count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-[11px]">
                      <span className="w-5 tabular-nums text-muted">{star}★</span>
                      <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums text-muted">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ReviewForm
            productId={productId}
            productName={productName}
            onSubmitted={(r) => setReviews((prev) => [r, ...prev])}
          />
        </div>

        {/* List */}
        {reviews.length > 0 && (
          <>
            <div className="mt-10 flex items-end justify-between gap-4 border-b border-line pb-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted">
                {stats.count} {stats.count === 1 ? "avaliação" : "avaliações"}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Ordenar:</span>
                {(
                  [
                    ["recent", "Recentes"],
                    ["best", "Melhores"],
                    ["worst", "Críticas"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSort(key)}
                    className={`px-3 py-1 rounded-md border transition-colors ${
                      sort === key
                        ? "btn-outline border-foreground bg-foreground text-background"
                        : "border-line text-muted hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {visible.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  myReaction={reactions[r.id] ?? null}
                  onReact={(kind) => react(r.id, kind)}
                  onReplyAdded={(reply) =>
                    updateReview(r.id, { replies: [...(r.replies ?? []), reply] })
                  }
                />
              ))}
            </div>

            {sortedReviews.length > 4 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="btn-trace inline-flex items-center gap-2 text-xs uppercase tracking-widest border border-foreground rounded-md px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors"
                >
                  {showAll ? "Mostrar menos" : `Ver todas (${sortedReviews.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* --------------- Review card --------------- */

function ReviewCard({
  review,
  myReaction,
  onReact,
  onReplyAdded,
}: {
  review: Review;
  myReaction: "like" | "dislike" | null;
  onReact: (kind: "like" | "dislike") => void;
  onReplyAdded: (r: Reply) => void;
}) {
  const media = parseMedia(review.media);
  const [replyOpen, setReplyOpen] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const replies = review.replies ?? [];
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);

  return (
    <article className="border-b border-line pb-6">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium flex-shrink-0">
          {initials(review.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{review.authorName}</div>
              <div className="text-[11px] text-muted">
                {review.city ? `${review.city} · ` : ""}
                {formatDate(review.createdAt)}
              </div>
            </div>
            {review.verified && (
              <span className="text-[10px] uppercase tracking-widest text-muted border border-line rounded-full px-2 py-0.5 whitespace-nowrap">
                Compra verificada
              </span>
            )}
          </div>
          <div className="mt-2">
            <StarRating rating={review.rating} size="sm" />
          </div>
          {review.title && (
            <h4 className="mt-3 font-medium text-base leading-snug">{review.title}</h4>
          )}
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{review.body}</p>

          {/* Media */}
          {media.length > 0 && <MediaGrid media={media} />}

          {/* Reactions + reply */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <button
              onClick={() => onReact("like")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all ${
                myReaction === "like"
                  ? "border-foreground bg-foreground text-background"
                  : "border-line text-muted hover:border-foreground hover:text-foreground"
              }`}
              aria-pressed={myReaction === "like"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 11v8a2 2 0 0 1-2 2H4v-10h3Z" />
                <path d="M7 11l4-7a2 2 0 0 1 2-1 2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18.6 20H7" />
              </svg>
              <span className="tabular-nums">{review.likes}</span>
            </button>
            <button
              onClick={() => onReact("dislike")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all ${
                myReaction === "dislike"
                  ? "border-foreground bg-foreground text-background"
                  : "border-line text-muted hover:border-foreground hover:text-foreground"
              }`}
              aria-pressed={myReaction === "dislike"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 13V5a2 2 0 0 0-2-2h-1v10h3Z" />
                <path d="M17 13l-4 7a2 2 0 0 1-2 1 2 2 0 0 1-2-2v-4H4a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 5.4 4H17" />
              </svg>
              <span className="tabular-nums">{review.dislikes}</span>
            </button>
            <button
              onClick={() => setReplyOpen((o) => !o)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-muted hover:border-foreground hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
              </svg>
              {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? "resposta" : "respostas"}` : "Responder"}
            </button>
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-5 space-y-4 border-l-2 border-line pl-5">
              {visibleReplies.map((rp) => {
                const isBrand = /hypado/i.test(rp.authorName);
                return (
                  <div key={rp.id} className="flex items-start gap-3">
                    {isBrand ? (
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: "#0a0a0a" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/brand/hypado-mark.png"
                          alt="HYPADO"
                          className="h-7 w-7 object-contain"
                          style={{
                            animation: "none",
                            filter: "brightness(0) invert(1)",
                          }}
                          loading="eager"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-surface text-foreground border border-line flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                        {initials(rp.authorName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium">{rp.authorName}</span>
                        {isBrand && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                            </svg>
                            Loja
                          </span>
                        )}
                        <span className="text-[11px] text-muted">{formatDate(rp.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{rp.body}</p>
                    </div>
                  </div>
                );
              })}
              {replies.length > 2 && (
                <button
                  onClick={() => setShowAllReplies((s) => !s)}
                  className="text-xs text-muted hover:text-foreground underline underline-offset-4"
                >
                  {showAllReplies ? "Esconder respostas" : `Ver mais ${replies.length - 2} respostas`}
                </button>
              )}
            </div>
          )}

          {replyOpen && (
            <ReplyForm
              reviewId={review.id}
              onSubmitted={(rep) => {
                onReplyAdded(rep);
                setReplyOpen(false);
              }}
              onCancel={() => setReplyOpen(false)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/* --------------- Media grid + lightbox --------------- */

function MediaGrid({ media }: { media: ReviewMedia[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const open = openIdx !== null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
      if (e.key === "ArrowRight") setOpenIdx((i) => (i === null ? null : (i + 1) % media.length));
      if (e.key === "ArrowLeft")
        setOpenIdx((i) => (i === null ? null : (i - 1 + media.length) % media.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, media.length]);

  const current = openIdx !== null ? media[openIdx] : null;

  return (
    <>
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {media.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface group"
          >
            {m.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt="Foto do cliente"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <>
                <video
                  src={m.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {open && current && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setOpenIdx(null)}
          role="dialog"
          aria-modal="true"
          style={{ animation: "none" }}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpenIdx(null)}
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>

          {media.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? null : (i - 1 + media.length) % media.length));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Próximo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? null : (i + 1) % media.length));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/70 tabular-nums">
                {String(openIdx! + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
              </div>
            </>
          )}

          {current.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: "none" }}
            />
          ) : (
            <video
              src={current.url}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: "none" }}
            />
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

/* --------------- Reply form --------------- */

function ReplyForm({
  reviewId,
  onSubmitted,
  onCancel,
}: {
  reviewId: string;
  onSubmitted: (r: Reply) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (name.trim().length < 2) return setErr("Coloca seu nome.");
    if (body.trim().length < 2) return setErr("Escreve uma resposta.");
    setBusy(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "fail");
      onSubmitted(data.reply);
    } catch {
      setErr("Não rolou. Tenta de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 border-l-2 border-foreground pl-5 space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        className="input-base text-sm"
        maxLength={80}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Responde com calma. Conta sua experiência."
        rows={3}
        className="input-base text-sm resize-y"
        maxLength={800}
      />
      {err && <div className="text-xs text-foreground/80">{err}</div>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="btn-trace btn-outline bg-foreground text-background px-4 py-2 text-xs uppercase tracking-widest rounded-md hover:bg-foreground/90 disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Publicar resposta"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* --------------- Main review form --------------- */

type Draft = {
  rating: number;
  name: string;
  city: string;
  title: string;
  body: string;
  media: { url: string; type: "image" | "video"; previewUrl?: string }[];
};

function ReviewForm({
  productId,
  productName,
  onSubmitted,
}: {
  productId: string;
  productName: string;
  onSubmitted: (r: Review) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    rating: 0,
    name: "",
    city: "",
    title: "",
    body: "",
    media: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILES = 4;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const slots = MAX_FILES - draft.media.length;
    if (slots <= 0) {
      setError(`Máximo ${MAX_FILES} arquivos.`);
      return;
    }
    const list = Array.from(files).slice(0, slots);
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        list.map(async (file) => {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "fail");
          }
          const data = await res.json();
          return {
            url: data.url,
            type: data.type as "image" | "video",
            previewUrl: URL.createObjectURL(file),
          };
        }),
      );
      setDraft((d) => ({ ...d, media: [...d.media, ...uploaded] }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fail";
      setError(
        msg === "too_large"
          ? "Arquivo muito grande. Imagem até 8MB, vídeo até 50MB."
          : msg === "invalid_type"
          ? "Formato não aceito. Use JPG, PNG, WEBP ou MP4/MOV."
          : "Falhou o upload. Tenta de novo.",
      );
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(i: number) {
    setDraft((d) => ({ ...d, media: d.media.filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (draft.rating < 1) return setError("Toque nas estrelas pra avaliar.");
    if (draft.name.trim().length < 2) return setError("Coloca seu nome.");
    if (draft.body.trim().length < 4) return setError("Escreve um pouco mais. Pelo menos uma frase.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: draft.rating,
          authorName: draft.name.trim(),
          city: draft.city.trim(),
          title: draft.title.trim(),
          body: draft.body.trim(),
          sessionId: getSessionId(),
          media: draft.media.map((m) => ({ url: m.url, type: m.type })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "fail");

      onSubmitted({ ...data.review, replies: [] });
      setThanks(true);
      setDraft({ rating: 0, name: "", city: "", title: "", body: "", media: [] });
      setTimeout(() => setThanks(false), 2500);
    } catch (e) {
      const code = e instanceof Error ? e.message : "fail";
      setError(
        code === "already_reviewed"
          ? "Você já avaliou este produto. Obrigado! Uma avaliação por produto já ajuda muito."
          : code === "duplicate"
          ? "Essa avaliação já foi enviada. Não precisa mandar de novo. 😉"
          : code === "rate_limited"
          ? "Calma aí! Muitas tentativas seguidas. Espera um minutinho e tenta de novo."
          : "Deu ruim aqui. Tenta de novo em alguns segundos.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (thanks) {
    return (
      <div className="bg-surface rounded-md p-10 border border-line text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted">Recebido</div>
        <p className="gothic mt-3 text-5xl md:text-6xl">Valeu pela palavra.</p>
        <p className="mt-4 text-foreground/70">
          Sua review tá no ar. Obrigado por fazer parte da família HYPADO.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface rounded-md p-4 md:p-5 border border-line grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
        <label className="text-[10px] uppercase tracking-[0.3em] text-muted">Sua nota</label>
        <StarInput value={draft.rating} onChange={(v) => setDraft((d) => ({ ...d, rating: v }))} />
      </div>

      <input
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder="Seu nome"
        className="input-base text-sm"
        maxLength={80}
      />

      <input
        value={draft.city}
        onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
        placeholder="Cidade (opcional). Ex: Recife, PE"
        className="input-base text-sm"
        maxLength={80}
      />

      <div className="md:col-span-2">
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder={`Como foi com "${productName}"? Caimento, tecido, entrega…`}
          rows={3}
          className="input-base text-sm resize-y min-h-20"
          maxLength={1200}
        />
        <div className="mt-1 text-[10px] text-muted text-right tabular-nums">
          {draft.body.length}/1200
        </div>
      </div>

      {/* Media upload — compacto */}
      <div className="md:col-span-2">
        <div className="grid grid-cols-4 gap-2">
          {draft.media.map((m, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-line bg-background group">
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.previewUrl || m.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <video
                  src={m.previewUrl || m.url}
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute top-1 left-1 text-[9px] uppercase tracking-widest bg-foreground/80 text-background px-1.5 py-0.5 rounded-sm">
                {m.type === "image" ? "Foto" : "Vídeo"}
              </span>
              <button
                type="button"
                onClick={() => removeMedia(i)}
                aria-label="Remover"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-foreground/85 text-background opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          {draft.media.length < MAX_FILES && (
            <label
              className={`relative aspect-square rounded-md border border-dashed border-line bg-background flex flex-col items-center justify-center text-center text-[10px] text-muted cursor-pointer hover:border-foreground hover:text-foreground transition-colors ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-1">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="px-1 leading-tight">
                {uploading ? "Enviando…" : "Foto/vídeo"}
              </span>
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="md:col-span-2 text-sm text-foreground bg-foreground/5 border border-foreground/20 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <div className="md:col-span-2 flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-muted leading-tight">
          Pública e assinada com seu nome.
        </p>
        <button
          type="submit"
          disabled={submitting || uploading}
          className="btn-trace btn-outline bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest rounded-md hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Enviando…" : "Publicar"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
