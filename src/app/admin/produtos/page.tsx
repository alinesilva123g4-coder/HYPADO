import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/format";

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
        <KpiCard label="Cadastrados" value={String(products.length)} hint={`${totalActive} ativos`} />
        <KpiCard
          label="Estoque total"
          value={totalStock.toLocaleString("pt-BR")}
          hint="unidades disponíveis"
          accent={totalStock === 0 ? "warn" : "default"}
        />
        <KpiCard
          label="Sem estoque"
          value={String(outCount)}
          hint="produtos esgotados"
          accent={outCount > 0 ? "danger" : "success"}
        />
        <KpiCard label="Valor em estoque" value={formatBRL(inventoryValue)} hint="preço × unidades" />
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
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
              <tr>
                <th className="p-3 w-14"></th>
                <th className="p-3">Produto</th>
                <th className="p-3 hidden md:table-cell">Categoria</th>
                <th className="p-3 hidden lg:table-cell">Vendas 30d</th>
                <th className="p-3 hidden lg:table-cell">Views 30d</th>
                <th className="p-3">Preço</th>
                <th className="p-3 hidden sm:table-cell">Estoque</th>
                <th className="p-3 w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => {
                const stock = p.variants.reduce((a, v) => a + v.stock, 0);
                const img = p.images[0]?.url;
                const sale = salesMap.get(p.id);
                const views = viewsMap.get(p.id) || 0;
                const stockTone =
                  stock === 0
                    ? "text-rose-700 bg-rose-50"
                    : stock < 10
                    ? "text-amber-700 bg-amber-50"
                    : "text-neutral-700 bg-neutral-50";
                return (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3">
                      <Link href={`/admin/produtos/${p.id}`} className="block">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover bg-neutral-100 border border-neutral-200"
                            style={{ animation: "none" }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <circle cx="9" cy="11" r="1.5" />
                              <path d="m21 17-5-5-7 7" />
                            </svg>
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="p-3 min-w-0">
                      <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:underline block truncate max-w-[260px]">
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span className="font-mono">/{p.slug}</span>
                        {p._count.reviews > 0 && (
                          <span className="text-amber-600">★ {p._count.reviews}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-neutral-700">
                      <span className="inline-block bg-neutral-100 text-neutral-700 text-[11px] px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {sale ? (
                        <div>
                          <div className="font-medium tabular-nums">{sale.qty} un</div>
                          <div className="text-[11px] text-neutral-500 tabular-nums">{formatBRL(sale.rev)}</div>
                        </div>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell tabular-nums text-neutral-700">
                      {views > 0 ? views.toLocaleString("pt-BR") : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="p-3 font-semibold tabular-nums">{formatBRL(p.priceCents)}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tabular-nums ${stockTone}`}>
                        {stock} un
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? "bg-emerald-500" : "bg-neutral-400"}`} />
                        {p.active ? "ativo" : "inativo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

function KpiCard({
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
