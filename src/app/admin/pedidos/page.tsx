import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/format";
import { OrderRow } from "./_components/OrderRow";
import { RealtimeRefresh } from "../_components/RealtimeRefresh";

export const dynamic = "force-dynamic";

const DAY = 86400_000;

const STATUSES = ["pending", "paid", "shipped", "delivered", "canceled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendentes",
  paid: "Pagos",
  shipped: "Enviados",
  delivered: "Entregues",
  canceled: "Cancelados",
};
const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-500",
  paid: "bg-blue-500",
  shipped: "bg-indigo-500",
  delivered: "bg-emerald-500",
  canceled: "bg-neutral-400",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status;
  const q = sp.q?.trim();
  const range = sp.range || "all"; // today | 7d | 30d | all

  const rangeStart: Date | undefined =
    range === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : range === "7d"
      ? new Date(Date.now() - 7 * DAY)
      : range === "30d"
      ? new Date(Date.now() - 30 * DAY)
      : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { whatsapp: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, statusCounts, todayAgg, weekAgg, monthAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      ...(rangeStart ? { where: { createdAt: { gte: rangeStart } } } : {}),
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 7 * DAY) } },
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 30 * DAY) } },
    }),
  ]);

  const totalRev = orders.reduce((a, o) => a + o.totalCents, 0);
  const avg = orders.length > 0 ? totalRev / orders.length : 0;
  const countMap = new Map(statusCounts.map((s) => [s.status, s._count._all]));
  const pendingCount = countMap.get("pending") || 0;

  return (
    <div>
      <RealtimeRefresh table="Order" insertLabel="Novo pedido HYPADO 🎉" />
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · vendas</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-sm text-neutral-500 mt-1.5">
          Gerencie todos os pedidos, atualize status e fale com o cliente direto pelo WhatsApp.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Hoje"
          value={formatBRL(todayAgg._sum.totalCents || 0)}
          hint={`${todayAgg._count} ${todayAgg._count === 1 ? "pedido" : "pedidos"}`}
        />
        <KpiCard
          label="Últimos 7 dias"
          value={formatBRL(weekAgg._sum.totalCents || 0)}
          hint={`${weekAgg._count} pedidos`}
          accent="success"
        />
        <KpiCard
          label="Últimos 30 dias"
          value={formatBRL(monthAgg._sum.totalCents || 0)}
          hint={`${monthAgg._count} pedidos`}
        />
        <KpiCard
          label="Aguardando ação"
          value={String(pendingCount)}
          hint="pedidos pendentes"
          accent={pendingCount > 0 ? "warn" : "success"}
        />
      </section>

      {/* Filtros */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-3 md:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
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
                placeholder="Buscar por nome ou WhatsApp…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
              />
              {status && <input type="hidden" name="status" value={status} />}
              {range !== "all" && <input type="hidden" name="range" value={range} />}
            </div>
          </form>
          <div className="flex flex-wrap gap-1.5">
            <Pill href={hrefWith(sp, { range: undefined })} active={range === "all"}>Sempre</Pill>
            <Pill href={hrefWith(sp, { range: "today" })} active={range === "today"}>Hoje</Pill>
            <Pill href={hrefWith(sp, { range: "7d" })} active={range === "7d"}>7 dias</Pill>
            <Pill href={hrefWith(sp, { range: "30d" })} active={range === "30d"}>30 dias</Pill>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-neutral-100">
          <Pill href={hrefWith(sp, { status: undefined })} active={!status}>
            <span className="inline-flex items-center gap-1.5">
              Todos <span className="text-[10px] opacity-70">({orders.length})</span>
            </span>
          </Pill>
          {STATUSES.map((s) => {
            const n = countMap.get(s) || 0;
            return (
              <Pill key={s} href={hrefWith(sp, { status: s })} active={status === s}>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                  {STATUS_LABEL[s]} <span className="text-[10px] opacity-70">({n})</span>
                </span>
              </Pill>
            );
          })}
        </div>
      </section>

      {/* Resumo dos resultados */}
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-3 px-1">
        <span>
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} · total {formatBRL(totalRev)}
          {orders.length > 0 && <> · ticket médio {formatBRL(avg)}</>}
        </span>
        {(q || status || range !== "all") && (
          <Link href="/admin/pedidos" className="text-neutral-600 hover:text-black underline-offset-2 hover:underline">
            limpar filtros
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          hint={q || status || range !== "all" ? "Tente ajustar os filtros." : "Quando entrar o primeiro pedido, ele aparece aqui."}
        />
      ) : (
        <ul className="space-y-2.5">
          {orders.map((o) => (
            <OrderRow
              key={o.id}
              order={{
                id: o.id,
                customerName: o.customerName,
                whatsapp: o.whatsapp,
                address: o.address,
                totalCents: o.totalCents,
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                items: o.items.map((it) => ({
                  id: it.id,
                  qty: it.qty,
                  size: it.size,
                  priceCents: it.priceCents,
                  productName: it.product.name,
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
  for (const [k, v] of Object.entries(next)) if (v && v !== "all") usp.set(k, v);
  const qs = usp.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
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

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "warn" | "success";
}) {
  const tone =
    accent === "warn"
      ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white"
      : accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : "border-neutral-200 bg-white";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 ${tone}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
      <div className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
          <rect x="3.5" y="7" width="17" height="14" rx="2" />
          <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M9 12h6M9 16h4" />
        </svg>
      </div>
      <div className="text-sm font-medium text-neutral-900">{title}</div>
      <div className="text-xs text-neutral-500 mt-1">{hint}</div>
    </div>
  );
}
