import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ---------- helpers ----------
const DAY = 86400_000;
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

function fmtPct(p: number | null) {
  if (p === null) return "novo";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(0)}%`;
}

// ---------- data ----------
async function getStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - DAY);
  const d7 = new Date(now.getTime() - 7 * DAY);
  const d14 = new Date(now.getTime() - 14 * DAY);
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d60 = new Date(now.getTime() - 60 * DAY);
  const d7Prev = new Date(now.getTime() - 14 * DAY);

  const [
    // receita / pedidos
    revToday,
    revYesterday,
    rev7,
    rev7Prev,
    rev30,
    rev30Prev,
    revTotal,
    ordersToday,
    ordersYesterday,
    orders7,
    orders30,
    pendingOrders,
    paidOrders30,
    // tráfego (funil)
    pageViews7,
    productViews7,
    addToCart7,
    uniqueSessions7Raw,
    // produtos
    totalProducts,
    activeProducts,
    // estoque
    lowStock,
    outOfStock,
    // reviews / leads
    totalReviews,
    avgRating,
    newLeads7,
    recentLeads,
    // listas
    recentOrders,
    // top sellers (últimos 30d)
    topSellersRaw,
    // série diária 14d
    dailyRev,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: d7 } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: d7Prev, lt: d7 } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: d30 } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: d7 } } }),
    prisma.order.count({ where: { createdAt: { gte: d30 } } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { createdAt: { gte: d30 }, status: { not: "pending" } } }),
    prisma.event.count({ where: { type: "page_view", createdAt: { gte: d7 } } }),
    prisma.event.count({ where: { type: "product_view", createdAt: { gte: d7 } } }),
    prisma.event.count({ where: { type: "add_to_cart", createdAt: { gte: d7 } } }),
    prisma.event.findMany({ where: { createdAt: { gte: d7 } }, select: { sessionId: true }, distinct: ["sessionId"] }),
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.variant.findMany({
      where: { stock: { lte: 3, gt: 0 } },
      include: { product: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.variant.findMany({
      where: { stock: 0 },
      include: { product: true },
      take: 5,
    }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.lead?.count({ where: { createdAt: { gte: d7 } } }) ?? Promise.resolve(0),
    prisma.lead?.findMany({ orderBy: { createdAt: "desc" }, take: 5 }) ?? Promise.resolve([]),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { qty: true, priceCents: true },
      where: { order: { createdAt: { gte: d30 } } },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<{ day: Date; revenue: bigint; orders: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COALESCE(SUM("totalCents"), 0) AS revenue,
             COUNT(*) AS orders
      FROM "Order"
      WHERE "createdAt" >= ${d14}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  // top sellers — busca nomes
  const sellerIds = topSellersRaw.map((t) => t.productId);
  const sellerProducts = sellerIds.length
    ? await prisma.product.findMany({ where: { id: { in: sellerIds } }, select: { id: true, name: true, priceCents: true } })
    : [];
  const sellerMap = new Map(sellerProducts.map((p) => [p.id, p]));
  const topSellers = topSellersRaw.map((t) => ({
    id: t.productId,
    name: sellerMap.get(t.productId)?.name || "—",
    qty: t._sum.qty || 0,
    revenue: t._sum.priceCents || 0,
  }));

  // série diária 14d normalizada (preenche dias vazios)
  const series: { day: Date; revenue: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(new Date(now.getTime() - i * DAY));
    const hit = dailyRev.find((r) => startOfDay(r.day).getTime() === d.getTime());
    series.push({
      day: d,
      revenue: hit ? Number(hit.revenue) : 0,
      orders: hit ? Number(hit.orders) : 0,
    });
  }

  return {
    today: { revenue: revToday._sum.totalCents || 0, orders: ordersToday },
    yesterday: { revenue: revYesterday._sum.totalCents || 0, orders: ordersYesterday },
    last7: { revenue: rev7._sum.totalCents || 0, orders: orders7 },
    last7Prev: { revenue: rev7Prev._sum.totalCents || 0, orders: rev7Prev._count || 0 },
    last30: { revenue: rev30._sum.totalCents || 0, orders: orders30 },
    last30Prev: { revenue: rev30Prev._sum.totalCents || 0, orders: rev30Prev._count || 0 },
    total: { revenue: revTotal._sum.totalCents || 0, orders: revTotal._count || 0 },
    pendingOrders,
    paidOrders30,
    funnel: {
      visitors: uniqueSessions7Raw.length,
      pageViews: pageViews7,
      productViews: productViews7,
      addToCart: addToCart7,
      orders: orders7,
    },
    products: { total: totalProducts, active: activeProducts },
    lowStock,
    outOfStock,
    reviews: { total: totalReviews, avg: avgRating._avg.rating || 0 },
    newLeads7,
    recentLeads,
    recentOrders,
    topSellers,
    series,
  };
}

type Stats = Awaited<ReturnType<typeof getStats>>;

// ---------- visual primitives ----------

function Sparkline({ values, color = "#171717" }: { values: number[]; color?: string }) {
  const w = 100;
  const h = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const gid = `g-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
        novo
      </span>
    );
  }
  const positive = pct >= 0;
  const tone = positive
    ? "text-emerald-700 bg-emerald-50 border-emerald-100"
    : "text-rose-700 bg-rose-50 border-rose-100";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tone}`}>
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="currentColor">
        {positive ? <path d="M6 2l4 5H2z" /> : <path d="M6 10L2 5h8z" />}
      </svg>
      {fmtPct(pct)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  hint,
  trend,
  spark,
  sparkColor,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
  spark?: number[];
  sparkColor?: string;
  accent?: "default" | "warn" | "success" | "info";
}) {
  const tone =
    accent === "warn"
      ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white"
      : accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : accent === "info"
      ? "border-sky-200 bg-gradient-to-br from-sky-50/70 to-white"
      : "border-neutral-200 bg-white";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 transition-shadow hover:shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
        {trend !== undefined && <TrendBadge pct={trend ?? null} />}
      </div>
      <div className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500 leading-tight">{hint}</div>}
      {spark && spark.length > 1 && (
        <div className="mt-2 -mb-1">
          <Sparkline values={spark} color={sparkColor || "#171717"} />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mt-8 md:mt-10 mb-3 md:mb-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">{children}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

// ---------- composite blocks ----------

function HeroToday({ s }: { s: Stats }) {
  const rev = s.today.revenue;
  const prev = s.yesterday.revenue;
  const trend = pctChange(rev, prev);
  const orderTrend = pctChange(s.today.orders, s.yesterday.orders);

  let humanMsg = "Bom dia! Sua loja já começou o dia.";
  if (rev === 0 && s.today.orders === 0) {
    humanMsg = "Ainda nenhum pedido hoje. Continue divulgando — o dia tá começando.";
  } else if (trend !== null && trend > 20) {
    humanMsg = `Tá voando! Já vendeu ${fmtPct(trend)} a mais que ontem inteiro.`;
  } else if (trend !== null && trend < -20) {
    humanMsg = "Movimento mais devagar que ontem. Talvez seja hora de uma promoção?";
  } else if (s.today.orders > 0) {
    humanMsg = `${s.today.orders} ${s.today.orders === 1 ? "pedido" : "pedidos"} hoje. Bom ritmo!`;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-900/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white p-5 md:p-7">
      <div aria-hidden className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
      <div aria-hidden className="absolute -left-6 -bottom-12 w-40 h-40 rounded-full bg-amber-300/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/60">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          hoje · ao vivo
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-end">
          <div className="col-span-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Receita hoje</div>
            <div className="mt-1 text-3xl md:text-5xl font-semibold tracking-tight tabular-nums">
              {formatBRL(rev)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
              <TrendBadge pct={trend} />
              <span>vs. ontem ({formatBRL(prev)})</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Pedidos</div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">{s.today.orders}</div>
            <div className="mt-1 text-[11px] text-white/60">
              ontem: {s.yesterday.orders} <TrendBadge pct={orderTrend} />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Aguardando você</div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">{s.pendingOrders}</div>
            <Link
              href="/admin/pedidos"
              className="mt-1 inline-flex text-[11px] text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
            >
              {s.pendingOrders > 0 ? "confirmar agora →" : "tudo em dia"}
            </Link>
          </div>
        </div>
        <div className="mt-5 text-sm text-white/80 leading-snug max-w-xl">{humanMsg}</div>
      </div>
    </section>
  );
}

function RevenueChart({ series }: { series: Stats["series"] }) {
  const w = 600;
  const h = 140;
  const pad = { l: 4, r: 4, t: 8, b: 18 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...series.map((p) => p.revenue));
  const barW = innerW / series.length;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">Vendas por dia</h2>
          <p className="text-[11px] text-neutral-500">Últimos 14 dias — passe o mouse nas barras</p>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">R$ · pedidos</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 md:h-40">
        {/* baseline */}
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#e5e5e5" strokeWidth="1" />
        {series.map((p, i) => {
          const barH = (p.revenue / max) * innerH;
          const x = pad.l + i * barW + 2;
          const y = h - pad.b - barH;
          const isToday = i === series.length - 1;
          return (
            <g key={i}>
              <title>
                {p.day.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {formatBRL(p.revenue)} ({p.orders} {p.orders === 1 ? "pedido" : "pedidos"})
              </title>
              <rect
                x={x}
                y={y}
                width={Math.max(2, barW - 4)}
                height={Math.max(0, barH)}
                rx="2"
                fill={isToday ? "#171717" : p.revenue > 0 ? "#404040" : "#e5e5e5"}
                className="transition-opacity hover:opacity-80"
              />
              {/* label nas pontas e a cada 3 */}
              {(i === 0 || i === series.length - 1 || i % 3 === 0) && (
                <text x={x + barW / 2 - 2} y={h - 5} textAnchor="middle" fontSize="8" fill="#737373">
                  {p.day.getDate()}/{p.day.getMonth() + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Funnel({ f }: { f: Stats["funnel"] }) {
  const base = Math.max(1, f.visitors, f.pageViews);
  const steps = [
    { label: "Visitaram a loja", value: f.visitors, hint: "pessoas diferentes nos últimos 7 dias", color: "bg-sky-500" },
    { label: "Viram um produto", value: f.productViews, hint: "abriram a página de algum produto", color: "bg-indigo-500" },
    { label: "Colocaram no carrinho", value: f.addToCart, hint: "demonstraram intenção de compra", color: "bg-violet-500" },
    { label: "Fecharam o pedido", value: f.orders, hint: "realmente compraram", color: "bg-emerald-500" },
  ];
  const conv = base > 0 ? (f.orders / base) * 100 : 0;

  let insight: string;
  if (f.visitors === 0) {
    insight = "Ainda sem visitantes essa semana. Compartilhe o link da loja no WhatsApp e Instagram pra começar.";
  } else if (conv >= 3) {
    insight = `Excelente! De cada 100 pessoas que entram, ${conv.toFixed(1)} compram. A média do setor é ~2%.`;
  } else if (f.addToCart > 0 && f.orders === 0) {
    insight = "Pessoas colocam no carrinho mas não fecham. Talvez o frete ou o WhatsApp esteja travando.";
  } else if (f.productViews > 0 && f.addToCart === 0) {
    insight = "Pessoas veem produtos mas não colocam no carrinho. Pode ser o preço ou as fotos.";
  } else if (f.visitors > 0 && f.productViews === 0) {
    insight = "Pessoas entram mas não clicam em nenhum produto. Vale rever a home.";
  } else {
    insight = `De cada 100 visitantes, ${conv.toFixed(1)} compram. Continue trazendo tráfego pra crescer.`;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">Caminho do cliente (7 dias)</h2>
          <p className="text-[11px] text-neutral-500">Da visita até a compra</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {steps.map((step, i) => {
          const pct = base > 0 ? (step.value / base) * 100 : 0;
          const dropFromPrev =
            i > 0 && steps[i - 1].value > 0 ? ((steps[i - 1].value - step.value) / steps[i - 1].value) * 100 : null;
          return (
            <li key={step.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-neutral-800">{step.label}</span>
                <span className="tabular-nums font-semibold">
                  {step.value.toLocaleString("pt-BR")}
                  <span className="text-neutral-400 font-normal ml-1">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full ${step.color} transition-all`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-neutral-500">{step.hint}</span>
                {dropFromPrev !== null && dropFromPrev > 0 && (
                  <span className="text-[10px] text-rose-600">↓ perdeu {dropFromPrev.toFixed(0)}% nessa etapa</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-[12px] text-neutral-700 leading-snug">
        <span className="font-semibold">💡 O que isso significa:</span> {insight}
      </div>
    </div>
  );
}

function TasksPanel({ s }: { s: Stats }) {
  const tasks: { label: string; href: string; count: number; tone: "warn" | "danger" | "info" }[] = [];
  if (s.pendingOrders > 0)
    tasks.push({ label: "pedidos esperando confirmação", href: "/admin/pedidos", count: s.pendingOrders, tone: "warn" });
  if (s.outOfStock.length > 0)
    tasks.push({ label: "variações sem estoque", href: "/admin/produtos", count: s.outOfStock.length, tone: "danger" });
  if (s.lowStock.length > 0)
    tasks.push({ label: "variações com estoque baixo", href: "/admin/produtos", count: s.lowStock.length, tone: "warn" });
  if (s.newLeads7 > 0)
    tasks.push({ label: "leads novos pra ativar", href: "/admin/configuracoes", count: s.newLeads7, tone: "info" });

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
      <h2 className="text-sm font-semibold mb-1">O que precisa de você</h2>
      <p className="text-[11px] text-neutral-500 mb-3">Tarefas prioritárias da loja agora</p>
      {tasks.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
          ✓ Tudo em dia! Nenhuma pendência no momento.
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t, i) => {
            const tone =
              t.tone === "danger"
                ? "border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-900"
                : t.tone === "warn"
                ? "border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-amber-900"
                : "border-sky-200 bg-sky-50 hover:bg-sky-100/70 text-sky-900";
            return (
              <li key={i}>
                <Link
                  href={t.href}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${tone}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-xl font-semibold tabular-nums">{t.count}</span>
                    <span className="text-sm">{t.label}</span>
                  </span>
                  <span className="text-xs">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InsightCards({ s }: { s: Stats }) {
  const aov = s.last30.orders > 0 ? s.last30.revenue / s.last30.orders : 0;
  const aovPrev = s.last30Prev.orders > 0 ? s.last30Prev.revenue / s.last30Prev.orders : 0;
  const conv = s.funnel.visitors > 0 ? (s.funnel.orders / s.funnel.visitors) * 100 : 0;
  // projeção mês: receita 30d / 30 * dias do mês atual
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projected = (s.last30.revenue / 30) * daysInMonth;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
          <span>💰</span> Ticket médio
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{formatBRL(aov)}</div>
        <div className="mt-1 text-[11px] text-neutral-600 leading-snug">
          Em média, cada cliente gasta esse valor por pedido.
          {aovPrev > 0 && (
            <> {aov >= aovPrev ? "Subiu" : "Caiu"} vs. mês anterior ({formatBRL(aovPrev)}).</>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
          <span>🎯</span> Taxa de conversão
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{conv.toFixed(1)}%</div>
        <div className="mt-1 text-[11px] text-neutral-600 leading-snug">
          De cada 100 pessoas que entram, {conv.toFixed(0)} compram.{" "}
          {conv >= 2 ? "Tá ótimo!" : "A média do setor é ~2%."}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
          <span>📈</span> Projeção do mês
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{formatBRL(projected)}</div>
        <div className="mt-1 text-[11px] text-neutral-600 leading-snug">
          Mantendo o ritmo dos últimos 30 dias, seu mês deve fechar nesse valor.
        </div>
      </div>
    </section>
  );
}

// ---------- page ----------

export default async function AdminDashboard() {
  const s = await getStats();

  const dailyRevSpark = s.series.map((p) => p.revenue);
  const dailyOrdersSpark = s.series.map((p) => p.orders);

  return (
    <div>
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · admin</div>
        <h1 className="mt-2 text-2xl md:text-4xl font-semibold tracking-tight">Painel da loja</h1>
        <p className="text-sm text-neutral-500 mt-1.5">
          Tudo o que tá acontecendo na sua loja, em linguagem clara.
        </p>
      </header>

      <HeroToday s={s} />

      <SectionTitle hint="Quanto entrou no caixa em cada período (vs. período anterior)">
        Receita
      </SectionTitle>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Últimos 7 dias"
          value={formatBRL(s.last7.revenue)}
          hint={`${s.last7.orders} ${s.last7.orders === 1 ? "pedido" : "pedidos"}`}
          trend={pctChange(s.last7.revenue, s.last7Prev.revenue)}
          spark={dailyRevSpark.slice(-7)}
          sparkColor="#10b981"
          accent="success"
        />
        <MetricCard
          label="Últimos 30 dias"
          value={formatBRL(s.last30.revenue)}
          hint={`${s.last30.orders} ${s.last30.orders === 1 ? "pedido" : "pedidos"}`}
          trend={pctChange(s.last30.revenue, s.last30Prev.revenue)}
          spark={dailyRevSpark}
          sparkColor="#171717"
        />
        <MetricCard
          label="Pedidos por dia"
          value={dailyOrdersSpark.slice(-7).reduce((a, b) => a + b, 0) > 0
            ? (dailyOrdersSpark.slice(-7).reduce((a, b) => a + b, 0) / 7).toFixed(1)
            : "0"}
          hint="média na última semana"
          spark={dailyOrdersSpark.slice(-7)}
          sparkColor="#6366f1"
          accent="info"
        />
        <MetricCard
          label="Receita total"
          value={formatBRL(s.total.revenue)}
          hint={`${s.total.orders} pedidos desde o início`}
        />
      </section>

      <SectionTitle hint="Indicadores importantes da saúde da loja">Indicadores</SectionTitle>
      <InsightCards s={s} />

      <SectionTitle>Vendas e caminho do cliente</SectionTitle>
      <section className="grid md:grid-cols-2 gap-3 md:gap-4">
        <RevenueChart series={s.series} />
        <Funnel f={s.funnel} />
      </section>

      <SectionTitle>Ações e operação</SectionTitle>
      <section className="grid md:grid-cols-2 gap-3 md:gap-4">
        <TasksPanel s={s} />

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Mais vendidos (30 dias)</h2>
            <Link href="/admin/produtos" className="text-xs text-neutral-500 hover:text-black">
              Ver todos →
            </Link>
          </div>
          {s.topSellers.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma venda nos últimos 30 dias ainda.</p>
          ) : (
            <ul className="space-y-2">
              {(() => {
                const max = Math.max(1, ...s.topSellers.map((t) => t.qty));
                return s.topSellers.map((t, i) => (
                  <li key={t.id}>
                    <Link
                      href={`/admin/produtos/${t.id}`}
                      className="block hover:bg-neutral-50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-semibold text-neutral-400 tabular-nums w-4">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium">{t.name}</span>
                        </span>
                        <span className="text-xs text-neutral-600 tabular-nums whitespace-nowrap">
                          {t.qty} un · {formatBRL(t.revenue)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden ml-6">
                        <div
                          className="h-full bg-neutral-900 rounded-full"
                          style={{ width: `${(t.qty / max) * 100}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-3 md:mt-4 grid md:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs text-neutral-500 hover:text-black">
              Ver tudo →
            </Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem pedidos ainda.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {s.recentOrders.map((o) => {
                const statusTone =
                  o.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : o.status === "paid" || o.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : o.status === "cancelled"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-neutral-100 text-neutral-700";
                return (
                  <li key={o.id} className="py-2.5 flex items-center justify-between text-sm gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{o.customerName}</div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                        <span>
                          {o.items.length} {o.items.length === 1 ? "item" : "itens"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusTone}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold tabular-nums">{formatBRL(o.totalCents)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Estoque crítico</h2>
            <Link href="/admin/produtos" className="text-xs text-neutral-500 hover:text-black">
              Produtos →
            </Link>
          </div>
          {s.outOfStock.length === 0 && s.lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">Tudo abastecido. ✓</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {s.outOfStock.map((v) => (
                <li key={v.id} className="py-2.5 flex items-center justify-between text-sm">
                  <Link href={`/admin/produtos/${v.productId}`} className="min-w-0 hover:underline flex-1">
                    <div className="font-medium truncate">{v.product.name}</div>
                    <div className="text-[11px] text-neutral-500">Tamanho {v.size}</div>
                  </Link>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-100 text-rose-800">
                    esgotado
                  </span>
                </li>
              ))}
              {s.lowStock.map((v) => (
                <li key={v.id} className="py-2.5 flex items-center justify-between text-sm">
                  <Link href={`/admin/produtos/${v.productId}`} className="min-w-0 hover:underline flex-1">
                    <div className="font-medium truncate">{v.product.name}</div>
                    <div className="text-[11px] text-neutral-500">Tamanho {v.size}</div>
                  </Link>
                  <span className="font-semibold text-amber-700 tabular-nums">{v.stock} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-3 md:mt-4 grid md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
            ⭐ Avaliações
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{s.reviews.avg.toFixed(1)}</span>
            <span className="text-xs text-neutral-500">média ({s.reviews.total} {s.reviews.total === 1 ? "avaliação" : "avaliações"})</span>
          </div>
          <div className="mt-2 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < Math.round(s.reviews.avg) ? "text-amber-400" : "text-neutral-200"}>★</span>
            ))}
          </div>
          <Link href="/admin/avaliacoes" className="mt-3 inline-block text-xs text-neutral-500 hover:text-black">
            Ver avaliações →
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
            📦 Catálogo
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{s.products.active}</span>
            <span className="text-xs text-neutral-500">ativos de {s.products.total}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${s.products.total > 0 ? (s.products.active / s.products.total) * 100 : 0}%` }}
            />
          </div>
          <Link href="/admin/produtos" className="mt-3 inline-block text-xs text-neutral-500 hover:text-black">
            Gerenciar →
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
            ✉️ Leads novos (7d)
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{s.newLeads7}</div>
          <p className="text-[11px] text-neutral-500 leading-snug mt-1">
            Pessoas que deixaram contato no pop-up da loja.
          </p>
          {s.recentLeads.length > 0 && (
            <ul className="mt-2.5 space-y-1 text-[11px] text-neutral-600">
              {s.recentLeads.slice(0, 3).map((l) => (
                <li key={l.id} className="truncate">
                  <span className="font-medium">{l.name}</span> · {l.phone}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
