import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DAY = 86400_000;

type RangeKey = "7d" | "30d" | "90d";
const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };

async function getData(range: RangeKey) {
  const now = new Date();
  const days = RANGE_DAYS[range];
  const since = new Date(now.getTime() - days * DAY);

  const [byType, topProducts, topPaths, dailyViews, uniqueSessions, conversions] = await Promise.all([
    prisma.event.groupBy({
      by: ["type"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.event.groupBy({
      by: ["productId"],
      _count: { _all: true },
      where: { type: "product_view", createdAt: { gte: since }, productId: { not: null } },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    prisma.event.groupBy({
      by: ["path"],
      _count: { _all: true },
      where: { type: "page_view", createdAt: { gte: since }, path: { not: null } },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw<{ day: Date; views: bigint; sessions: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*) FILTER (WHERE type = 'page_view') AS views,
             COUNT(DISTINCT "sessionId") AS sessions
      FROM "Event"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.event.findMany({
      where: { createdAt: { gte: since } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
  ]);

  const productNames = topProducts.length
    ? await prisma.product.findMany({
        where: { id: { in: topProducts.map((p) => p.productId!).filter(Boolean) } },
        select: { id: true, name: true },
      })
    : [];
  const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

  // série diária preenchida
  const series: { day: Date; views: number; sessions: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    d.setHours(0, 0, 0, 0);
    const hit = dailyViews.find((r) => {
      const x = new Date(r.day);
      x.setHours(0, 0, 0, 0);
      return x.getTime() === d.getTime();
    });
    series.push({
      day: d,
      views: hit ? Number(hit.views) : 0,
      sessions: hit ? Number(hit.sessions) : 0,
    });
  }

  return {
    byType: new Map(byType.map((b) => [b.type, b._count._all])),
    topProducts: topProducts.map((p) => ({
      id: p.productId!,
      name: nameMap.get(p.productId!) || "—",
      count: p._count._all,
    })),
    topPaths: topPaths.map((p) => ({ path: p.path || "(home)", count: p._count._all })),
    series,
    uniqueSessions: uniqueSessions.length,
    conversions,
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range: RangeKey = sp.range === "7d" || sp.range === "90d" ? sp.range : "30d";
  const d = await getData(range);

  const pageViews = d.byType.get("page_view") || 0;
  const productViews = d.byType.get("product_view") || 0;
  const addToCart = d.byType.get("add_to_cart") || 0;
  const convRate = d.uniqueSessions > 0 ? (d.conversions / d.uniqueSessions) * 100 : 0;
  const viewsPerSession = d.uniqueSessions > 0 ? pageViews / d.uniqueSessions : 0;

  return (
    <div>
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · analytics</div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Comportamento</h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Como as pessoas estão navegando na sua loja nos últimos {RANGE_DAYS[range]} dias.
          </p>
        </div>
        <div className="flex gap-1.5">
          <Pill href="/admin/analytics?range=7d" active={range === "7d"}>7 dias</Pill>
          <Pill href="/admin/analytics?range=30d" active={range === "30d"}>30 dias</Pill>
          <Pill href="/admin/analytics?range=90d" active={range === "90d"}>90 dias</Pill>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Visitantes únicos" value={d.uniqueSessions.toLocaleString("pt-BR")} hint="sessões diferentes" accent="info" />
        <Kpi label="Page views" value={pageViews.toLocaleString("pt-BR")} hint={`${viewsPerSession.toFixed(1)} por sessão`} />
        <Kpi label="Carrinho" value={addToCart.toLocaleString("pt-BR")} hint="adições ao carrinho" />
        <Kpi
          label="Conversão"
          value={`${convRate.toFixed(1)}%`}
          hint={`${d.conversions} pedidos`}
          accent={convRate >= 2 ? "success" : "default"}
        />
      </section>

      {/* Gráfico diário */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Tráfego diário</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">Visitantes únicos e page views por dia</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900" /> visitantes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-300" /> page views
            </span>
          </div>
        </div>
        {d.series.every((p) => p.views === 0 && p.sessions === 0) ? (
          <p className="text-sm text-neutral-500 py-10 text-center">Sem dados nesse período ainda.</p>
        ) : (
          <DailyChart series={d.series} />
        )}
      </section>

      {/* Listas */}
      <section className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Produtos mais vistos</h2>
            <span className="text-[11px] text-neutral-500">PDPs abertas</span>
          </div>
          {d.topProducts.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem dados.</p>
          ) : (
            <ul className="space-y-2">
              {(() => {
                const max = Math.max(1, ...d.topProducts.map((p) => p.count));
                return d.topProducts.map((p, i) => (
                  <li key={i}>
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="block hover:bg-neutral-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-semibold text-neutral-400 tabular-nums w-4">{i + 1}</span>
                          <span className="truncate font-medium">{p.name}</span>
                        </span>
                        <span className="text-xs text-neutral-600 tabular-nums">{p.count}</span>
                      </div>
                      <div className="mt-1 ml-6 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-900" style={{ width: `${(p.count / max) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Páginas mais vistas</h2>
            <span className="text-[11px] text-neutral-500">por URL</span>
          </div>
          {d.topPaths.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem dados.</p>
          ) : (
            <ul className="space-y-2">
              {(() => {
                const max = Math.max(1, ...d.topPaths.map((p) => p.count));
                return d.topPaths.map((p, i) => (
                  <li key={i}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-semibold text-neutral-400 tabular-nums w-4">{i + 1}</span>
                        <span className="truncate font-mono text-xs">{p.path}</span>
                      </span>
                      <span className="text-xs text-neutral-600 tabular-nums">{p.count}</span>
                    </div>
                    <div className="mt-1 ml-6 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>
      </section>

      {/* Tipos de evento */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
        <h2 className="text-sm font-semibold mb-3">Eventos por tipo</h2>
        {d.byType.size === 0 ? (
          <p className="text-sm text-neutral-500">Sem eventos ainda.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from(d.byType.entries()).map(([type, count]) => (
              <div key={type} className="bg-neutral-50 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono">{type}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{count.toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DailyChart({ series }: { series: { day: Date; views: number; sessions: number }[] }) {
  const w = 800;
  const h = 180;
  const pad = { l: 4, r: 4, t: 12, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...series.map((p) => Math.max(p.views, p.sessions)));
  const barW = innerW / series.length;
  const labelStep = Math.max(1, Math.floor(series.length / 8));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40 md:h-48">
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + innerH * (1 - t)}
          y2={pad.t + innerH * (1 - t)}
          stroke="#f5f5f5"
          strokeWidth="1"
        />
      ))}
      <line x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="#e5e5e5" strokeWidth="1" />
      {series.map((p, i) => {
        const sessionsH = (p.sessions / max) * innerH;
        const viewsH = (p.views / max) * innerH;
        const x = pad.l + i * barW;
        const gap = 2;
        const subW = (barW - gap * 3) / 2;
        return (
          <g key={i}>
            <title>
              {p.day.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {p.sessions} visitantes, {p.views} views
            </title>
            <rect
              x={x + gap}
              y={h - pad.b - sessionsH}
              width={subW}
              height={Math.max(0, sessionsH)}
              fill="#171717"
              rx="2"
            />
            <rect
              x={x + gap + subW + gap}
              y={h - pad.b - viewsH}
              width={subW}
              height={Math.max(0, viewsH)}
              fill="#d4d4d4"
              rx="2"
            />
            {i % labelStep === 0 && (
              <text x={x + barW / 2} y={h - 6} textAnchor="middle" fontSize="9" fill="#737373">
                {p.day.getDate()}/{p.day.getMonth() + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {children}
    </Link>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "success" | "info";
}) {
  const tone =
    accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : accent === "info"
      ? "border-sky-200 bg-gradient-to-br from-sky-50/70 to-white"
      : "border-neutral-200 bg-white";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 ${tone}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
      <div className="mt-1.5 text-xl md:text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}
