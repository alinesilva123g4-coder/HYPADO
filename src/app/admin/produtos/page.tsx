import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/format";
import { ProductRow } from "./_components/ProductRow";
import { RealtimeRefresh } from "../_components/RealtimeRefresh";

export const dynamic = "force-dynamic";

const DAY = 86400_000;

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const cat = sp.cat?.trim();
  const status = sp.status; // active | inactive

  const d30 = new Date(Date.now() - 30 * DAY);

  const [products, categories, sales30Raw, views30Raw] = await Promise.all([
    prisma.product.findMany({
      where: {
        AND: [
          q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {},
          cat ? { category: cat } : {},
          status === "active" ? { active: true } : status === "inactive" ? { active: false } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: true,
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.findMany({ select: { category: true }, distinct: ["category"] }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { qty: true, priceCents: true },
      where: { order: { createdAt: { gte: d30 } } },
    }),
    prisma.event.groupBy({
      by: ["productId"],
      _count: { _all: true },
      where: { type: "product_view", createdAt: { gte: d30 }, productId: { not: null } },
    }),
  ]);

  const salesMap = new Map(sales30Raw.map((s) => [s.productId, { qty: s._sum.qty || 0, rev: s._sum.priceCents || 0 }]));
  const viewsMap = new Map(views30Raw.map((v) => [v.productId!, v._count._all]));

  // global stats
  const totalActive = products.filter((p) => p.active).length;
  const totalStock = products.reduce((a, p) => a + p.variants.reduce((b, v) => b + v.stock, 0), 0);
  const outCount = products.filter((p) => p.variants.length > 0 && p.variants.every((v) => v.stock === 0)).length;
  const inventoryValue = products.reduce(
    (a, p) => a + p.variants.reduce((b, v) => b + v.stock, 0) * p.priceCents,
    0
  );

  return (
    <div>
      <RealtimeRefresh table="Product" />
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · catálogo</div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            {products.length} {products.length === 1 ? "item encontrado" : "itens encontrados"}
            {(q || cat || status) && " (filtros ativos)"}
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo produto
        </Link>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Cadastrados" value={String(products.length)} hint={`${totalActive} ativos`} icon="box" />
        <KpiCard
          label="Estoque total"
          value={totalStock.toLocaleString("pt-BR")}
          hint="unidades disponíveis"
          accent={totalStock === 0 ? "warn" : "default"}
          icon="layers"
        />
        <KpiCard
          label="Sem estoque"
          value={String(outCount)}
          hint="produtos esgotados"
          accent={outCount > 0 ? "danger" : "success"}
          icon="alert"
        />
        <KpiCard label="Valor em estoque" value={formatBRL(inventoryValue)} hint="preço × unidades" icon="money" />
      </section>

      {/* Filtros */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-2 md:items-center">
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
              placeholder="Buscar por nome ou slug…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
            />
            {cat && <input type="hidden" name="cat" value={cat} />}
            {status && <input type="hidden" name="status" value={status} />}
          </div>
        </form>
        <div className="flex flex-wrap gap-1.5 items-center">
          <Pill href={hrefWith(sp, { status: undefined })} active={!status}>Todos</Pill>
          <Pill href={hrefWith(sp, { status: "active" })} active={status === "active"}>Ativos</Pill>
          <Pill href={hrefWith(sp, { status: "inactive" })} active={status === "inactive"}>Inativos</Pill>
          <span className="mx-1 h-4 w-px bg-neutral-200" />
          <Pill href={hrefWith(sp, { cat: undefined })} active={!cat}>Todas categorias</Pill>
          {categories.map((c) => (
            <Pill key={c.category} href={hrefWith(sp, { cat: c.category })} active={cat === c.category}>
              {c.category}
            </Pill>
          ))}
        </div>
      </section>

      {/* Lista */}
      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          hint={q || cat || status ? "Tente limpar os filtros." : "Cadastre seu primeiro produto pra começar."}
          actionLabel="+ Novo produto"
          actionHref="/admin/produtos/novo"
        />
      ) : (
        <ul className="space-y-2.5">
          {products.map((p) => {
            const stock = p.variants.reduce((a, v) => a + v.stock, 0);
            const sale = salesMap.get(p.id);
            return (
              <ProductRow
                key={p.id}
                p={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  category: p.category,
                  priceCents: p.priceCents,
                  active: p.active,
                  stock,
                  reviews: p._count.reviews,
                  imageUrl: p.images[0]?.url ?? null,
                  sales: sale ? { qty: sale.qty, rev: sale.rev } : null,
                  views: viewsMap.get(p.id) || 0,
                }}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- helpers ----------

function hrefWith(sp: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const next = { ...sp, ...patch };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) usp.set(k, v);
  const qs = usp.toString();
  return qs ? `/admin/produtos?${qs}` : "/admin/produtos";
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

const KPI_ICONS: Record<string, React.ReactNode> = {
  box: (
    <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9ZM3 7.5 12 12m0 0 9-4.5M12 12v9" />
  ),
  layers: <path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5" />,
  alert: <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  money: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.4-2.5 1.5-2.5.6-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></>,
};

function KpiCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "warn" | "danger" | "success";
  icon?: keyof typeof KPI_ICONS;
}) {
  const tone =
    accent === "warn"
      ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white"
      : accent === "danger"
      ? "border-rose-200 bg-gradient-to-br from-rose-50/70 to-white"
      : accent === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white"
      : "border-neutral-200 bg-white";
  const iconTone =
    accent === "warn"
      ? "text-amber-500"
      : accent === "danger"
      ? "text-rose-500"
      : accent === "success"
      ? "text-emerald-500"
      : "text-neutral-400";
  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 transition-shadow hover:shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</div>
        {icon && KPI_ICONS[icon] && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 shrink-0 ${iconTone}`}>
            {KPI_ICONS[icon]}
          </svg>
        )}
      </div>
      <div className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

function EmptyState({
  title,
  hint,
  actionLabel,
  actionHref,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
          <path d="M3 7.5 12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M12 12 3 7.5M12 12l9-4.5M12 12v9" />
        </svg>
      </div>
      <div className="text-sm font-medium text-neutral-900">{title}</div>
      <div className="text-xs text-neutral-500 mt-1">{hint}</div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-4 bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
