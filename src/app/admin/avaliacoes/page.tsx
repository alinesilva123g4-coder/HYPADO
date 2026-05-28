import Link from "next/link";
import { prisma } from "@/lib/db";
import { ReviewRow } from "./_components/ReviewRow";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string; verified?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const rating = sp.rating ? Number(sp.rating) : undefined;
  const verifiedFilter = sp.verified; // "yes" | "no"
  const q = sp.q?.trim();

  const where = {
    ...(rating ? { rating } : {}),
    ...(verifiedFilter === "yes" ? { verified: true } : verifiedFilter === "no" ? { verified: false } : {}),
    ...(q
      ? {
          OR: [
            { authorName: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [reviews, total, avgAgg, verifiedCount, byRating] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        replies: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.count({ where: { verified: true } }),
    prisma.review.groupBy({ by: ["rating"], _count: { _all: true } }),
  ]);

  const avg = avgAgg._avg.rating || 0;
  const verifiedPct = total > 0 ? (verifiedCount / total) * 100 : 0;
  const ratingMap = new Map(byRating.map((r) => [r.rating, r._count._all]));
  const maxBar = Math.max(1, ...byRating.map((r) => r._count._all));
  const unansweredCount = reviews.filter((r) => r.replies.length === 0).length;

  return (
    <div>
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · social proof</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Avaliações</h1>
        <p className="text-sm text-neutral-500 mt-1.5">
          Veja o que os clientes estão dizendo, responda e marque como verificada.
        </p>
      </header>

      {/* KPIs + distribuição */}
      <section className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">Nota média</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-semibold tabular-nums">{avg.toFixed(1)}</span>
            <span className="text-xs text-neutral-500">/ 5</span>
          </div>
          <div className="mt-2 flex gap-0.5 text-lg">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < Math.round(avg) ? "text-amber-400" : "text-neutral-200"}>
                ★
              </span>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            de {total} {total === 1 ? "avaliação" : "avaliações"} no total
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 md:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium mb-2">
            Distribuição
          </div>
          <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((r) => {
              const n = ratingMap.get(r) || 0;
              const pct = total > 0 ? (n / total) * 100 : 0;
              return (
                <li key={r}>
                  <Link
                    href={hrefWith(sp, { rating: rating === r ? undefined : String(r) })}
                    className={`flex items-center gap-2 text-xs group ${
                      rating === r ? "font-semibold" : ""
                    }`}
                  >
                    <span className="w-8 text-amber-500 tabular-nums">{r}★</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 group-hover:bg-amber-500 transition-colors"
                        style={{ width: `${(n / maxBar) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right tabular-nums text-neutral-600">
                      {n} <span className="text-neutral-400">({pct.toFixed(0)}%)</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <MiniStat label="Verificadas" value={`${verifiedCount}`} hint={`${verifiedPct.toFixed(0)}% do total`} accent="success" />
        <MiniStat
          label="Sem resposta"
          value={String(unansweredCount)}
          hint="entre as listadas"
          accent={unansweredCount > 0 ? "warn" : "default"}
        />
        <MiniStat
          label="Negativas (1-2★)"
          value={String((ratingMap.get(1) || 0) + (ratingMap.get(2) || 0))}
          hint="precisam de atenção"
          accent={(ratingMap.get(1) || 0) + (ratingMap.get(2) || 0) > 0 ? "danger" : "default"}
        />
      </section>

      {/* Filtros */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <form className="flex-1 min-w-0">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={q || ""}
              placeholder="Buscar por autor ou texto…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
            />
            {rating && <input type="hidden" name="rating" value={String(rating)} />}
            {verifiedFilter && <input type="hidden" name="verified" value={verifiedFilter} />}
          </div>
        </form>
        <div className="flex flex-wrap gap-1.5">
          <Pill href={hrefWith(sp, { verified: undefined })} active={!verifiedFilter}>Todas</Pill>
          <Pill href={hrefWith(sp, { verified: "yes" })} active={verifiedFilter === "yes"}>Verificadas</Pill>
          <Pill href={hrefWith(sp, { verified: "no" })} active={verifiedFilter === "no"}>Não verificadas</Pill>
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-neutral-500 mb-3 px-1">
        <span>
          Mostrando {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
          {reviews.length === 100 && <> (limitado a 100)</>}
        </span>
        {(q || rating || verifiedFilter) && (
          <Link href="/admin/avaliacoes" className="text-neutral-600 hover:text-black hover:underline">
            limpar filtros
          </Link>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação encontrada"
          hint={q || rating || verifiedFilter ? "Tente ajustar os filtros." : "Quando o primeiro cliente avaliar, aparece aqui."}
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewRow
              key={r.id}
              review={{
                id: r.id,
                rating: r.rating,
                authorName: r.authorName,
                city: r.city,
                title: r.title,
                body: r.body,
                verified: r.verified,
                likes: r.likes,
                dislikes: r.dislikes,
                createdAt: r.createdAt.toISOString(),
                product: r.product,
                replies: r.replies.map((rp) => ({
                  id: rp.id,
                  authorName: rp.authorName,
                  body: rp.body,
                  createdAt: rp.createdAt.toISOString(),
                })),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function hrefWith(sp: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const next = { ...sp, ...patch };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) usp.set(k, v);
  const qs = usp.toString();
  return qs ? `/admin/avaliacoes?${qs}` : "/admin/avaliacoes";
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {children}
    </Link>
  );
}

function MiniStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "warn" | "danger" | "success";
}) {
  const tone =
    accent === "warn"
      ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white"
      : accent === "danger"
      ? "border-rose-200 bg-gradient-to-br from-rose-50/70 to-white"
      : accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : "border-neutral-200 bg-white";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 ${tone}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
          <path d="m12 3.5 2.6 5.4 6 .8-4.4 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.4-4.1 6-.8L12 3.5Z" />
        </svg>
      </div>
      <div className="text-sm font-medium text-neutral-900">{title}</div>
      <div className="text-xs text-neutral-500 mt-1">{hint}</div>
    </div>
  );
}
