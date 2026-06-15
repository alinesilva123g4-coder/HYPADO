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
        <Kpi label="Visitantes únicos" value={d.uniqueSessions.toLocaleString("pt-BR")} hint="sessões diferentes" accent="info" icon="users" />
        <Kpi label="Page views" value={pageViews.toLocaleString("pt-BR")} hint={`${viewsPerSession.toFixed(1)} por sessão`} icon="eye" />
        <Kpi label="Carrinho" value={addToCart.toLocaleString("pt-BR")} hint="adições ao carrinho" icon="cart" />
        <Kpi
          label="Conversão"
          value={`${convRate.toFixed(1)}%`}
          hint={`${d.conversions} pedidos`}
          accent={convRate >= 2 ? "success" : "default"}
          icon="target"
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
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" /> visitantes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> page views
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

function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function DailyChart({ series }: { series: { day: Date; views: number; sessions: number }[] }) {
  const w = 820;
  const h = 200;
  const pad = { l: 6, r: 6, t: 16, b: 26 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...series.map((p) => Math.max(p.views, p.sessions)));
  const n = series.length;
  const colW = innerW / Math.max(1, n - 1);
  const x = (i: number) => pad.l + i * colW;
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const labelStep = Math.max(1, Math.floor(n / 8));

  const viewsPts = series.map((p, i) => [x(i), y(p.views)] as [number, number]);
  const sessionsPts = series.map((p, i) => [x(i), y(p.sessions)] as [number, number]);
  const viewsLine = smoothPath(viewsPts);
  const sessionsLine = smoothPath(sessionsPts);
  const baseY = pad.t + innerH;
  const viewsArea = `${viewsLine} L ${x(n - 1)},${baseY} L ${x(0)},${baseY} Z`;
  const sessionsArea = `${sessionsLine} L ${x(n - 1)},${baseY} L ${x(0)},${baseY} Z`;

  // pico de visitantes pra destacar
  const peakIdx = series.reduce((best, p, i) => (p.sessions > series[best].sessions ? i : best), 0);
  const peak = series[peakIdx];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 md:h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#171717" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#171717" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + innerH * t}
          y2={pad.t + innerH * t}
          stroke="#f1f1f1"
          strokeWidth="1"
          strokeDasharray={t === 1 ? "0" : "4 5"}
        />
      ))}

      {/* page views (área clara, atrás) */}
      <path d={viewsArea} fill="url(#viewsGrad)" />
      <path d={viewsLine} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

      {/* visitantes (área escura, à frente) */}
      <path d={sessionsArea} fill="url(#sessGrad)" />
      <path d={sessionsLine} fill="none" stroke="#171717" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

      {/* destaque do pico de visitantes */}
      {peak.sessions > 0 && (
        <>
          <line x1={x(peakIdx)} x2={x(peakIdx)} y1={y(peak.sessions)} y2={baseY} stroke="#171717" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
          <circle cx={x(peakIdx)} cy={y(peak.sessions)} r="4" fill="#171717" stroke="#fff" strokeWidth="2" />
        </>
      )}

      {/* x labels + hover hitboxes */}
      {series.map((p, i) => (
        <g key={i}>
          <rect x={x(i) - colW / 2} y={pad.t} width={colW} height={innerH} fill="transparent">
            <title>
              {p.day.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {p.sessions} visitantes, {p.views} views
            </title>
          </rect>
          {i % labelStep === 0 && (
            <text x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {p.day.getDate()}/{p.day.getMonth() + 1}
            </text>
          )}
        </g>
      ))}
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

const ANALYTICS_ICONS: Record<string, React.ReactNode> = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
};

function Kpi({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "success" | "info";
  icon?: keyof typeof ANALYTICS_ICONS;
}) {
  const tone =
    accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : accent === "info"
      ? "border-sky-200 bg-gradient-to-br from-sky-50/70 to-white"
      : "border-neutral-200 bg-white";
  const iconTone =
    accent === "success" ? "text-emerald-500" : accent === "info" ? "text-sky-500" : "text-neutral-400";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 transition-shadow hover:shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
        {icon && ANALYTICS_ICONS[icon] && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 shrink-0 ${iconTone}`}>
            {ANALYTICS_ICONS[icon]}
          </svg>
        )}
      </div>
      <div className="mt-1.5 text-xl md:text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}
