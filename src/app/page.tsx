import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { HeroMedia } from "@/components/motion/HeroMedia";

export const revalidate = 60;

const HERO_IMAGE = "/lifestyle/SaveClip.App_601384381_17988174713878696_2857454434521099802_n.jpg";
const HERO_VIDEO = "/hero.mp4";
const BENTO_LIFESTYLE = "/lifestyle/SaveClip.App_602687501_17988172538878696_8271872521100818131_n.jpg";
const CATEGORIES = ["Blusas", "Calças", "Shorts", "Kits", "Camisetas"] as const;
const GMN_URL = "https://share.google/l1WSU00AfqlVSQddy";
const MAP_EMBED =
  "https://www.google.com/maps?q=Limoeiro+do+Norte,+CE,+Brasil&z=13&output=embed";

export default async function HomePage() {
  const [productsRaw, categoryAnchors, categoryCountsRaw, topReviewsRaw] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        reviews: { select: { rating: true } },
      },
      take: 24,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { slug: { in: CATEGORIES.map((c) => `${c.toLowerCase()}-01`) } },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.product.groupBy({
      by: ["category"],
      where: { active: true, category: { in: [...CATEGORIES] } },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { rating: { gte: 4 } },
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  // Ordem da vitrine §03: primeiro Blusas, depois Shorts, depois Calças, e o
  // resto na sequência. Dentro de cada grupo mantém os mais recentes primeiro
  // (productsRaw já vem createdAt desc + sort estável).
  const CATEGORY_ORDER: Record<string, number> = { Blusas: 0, Shorts: 1, Calças: 2 };
  const orderOf = (c: string) => CATEGORY_ORDER[c] ?? 99;

  const products = productsRaw
    .map((p) => {
      const count = p.reviews.length;
      const avg = count > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
      return { ...p, rating: avg, reviewCount: count };
    })
    .sort((a, b) => orderOf(a.category) - orderOf(b.category))
    .slice(0, 12);

  const anchorBySlug = new Map(categoryAnchors.map((p) => [p.slug, p.images[0]?.url]));
  const countByCategory = new Map(categoryCountsRaw.map((c) => [c.category, c._count._all]));
  // "Camisetas" é longo e corta no card — exibe "Camisa" (só rótulo; categoria/URL seguem "Camisetas").
  const labelFor = (name: string) => (name === "Camisetas" ? "Camisa" : name);
  // Kits sai da grade e vira faixa horizontal (estilo Lookbook) — grade fica 2×2 limpa no mobile.
  const gridCategories = CATEGORIES.filter((c) => c !== "Kits");
  const categoryTiles = gridCategories.map((c, i) => ({
    name: c,
    label: labelFor(c),
    index: String(i + 1).padStart(2, "0"),
    count: countByCategory.get(c) ?? 0,
    image: anchorBySlug.get(`${c.toLowerCase()}-01`) ?? HERO_IMAGE,
  }));
  const kitsCount = countByCategory.get("Kits") ?? 0;


  return (
    <>
      {/* ===================== HERO — lifestyle, ancorado à esquerda ===================== */}
      <section className="relative h-[78vh] min-h-[480px] md:h-[90vh] md:min-h-[600px] w-full overflow-hidden">
        <HeroMedia
          video={HERO_VIDEO}
          poster={HERO_IMAGE}
          className="absolute inset-0 h-full w-full object-cover hp-hero-img"
        />
        {/* Scrim quente: tinta no rodapé + calor de sol vindo da esquerda */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_10%_100%,rgba(0,0,0,0.28),transparent_60%)]" />

        <div className="absolute inset-0 mx-auto max-w-7xl px-5 md:px-8 flex flex-col justify-end pb-9 md:pb-16">
          <div className="max-w-2xl text-white">
            <h1 className="gothic text-6xl md:text-9xl leading-[0.85]">
              Drop{" "}
              <span className="editorial align-baseline">zero&nbsp;um</span>
            </h1>
            <p className="mt-3 md:mt-4 max-w-md text-xs md:text-base opacity-90 leading-relaxed">
              Streetwear nordestino. Coleção limitada. Peças com a{" "}
              <span className="editorial">raiz</span> do norte, cortadas pra rua.
            </p>
            <div className="mt-5 md:mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/categoria/Blusas"
                className="btn-trace btn-outline inline-flex items-center gap-2 bg-white px-6 md:px-7 py-3 text-[11px] md:text-xs uppercase tracking-widest text-ink hover:bg-white/90 rounded-md"
              >
                Ver coleção
              </Link>
              <Link
                href="/lookbook"
                className="accent-underline text-[11px] md:text-xs uppercase tracking-widest text-white/90 hover:text-white nudge-down-1"
              >
                Lookbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORIAS — bento assimétrico (lifestyle + still) ===================== */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-20">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-xl md:text-3xl font-medium leading-tight tracking-tight">
              Explorar por <span className="editorial">linha</span>
            </h2>
          </div>
          <Link
            href="/categoria/Camisetas"
            className="accent-underline hidden md:inline text-xs uppercase tracking-widest text-muted hover:text-foreground nudge-down-2"
          >
            Ver tudo
          </Link>
        </div>

        {/* Régua hachurada separando o header dos patches */}
        <div className="hatch-rule mb-3 md:mb-5" />

        {/* Patches nordestinos — blocos de tinta, sem imagens, alturas alternadas */}
        <Reveal className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {categoryTiles.map((c, i) => {
            const palette = [
              { bg: "bg-[#C24E2D]", fg: "text-[#FBF2E4]", muted: "text-[#FBF2E4]/70", border: "border-[#FBF2E4]/30", tilt: "tilt-l" },
              { bg: "bg-[#E4A24A]", fg: "text-[#1E1B17]", muted: "text-[#1E1B17]/70", border: "border-[#1E1B17]/25", tilt: "tilt-r" },
              { bg: "bg-[#1E1B17]", fg: "text-[#FBF2E4]", muted: "text-[#FBF2E4]/65", border: "border-[#FBF2E4]/25", tilt: "tilt-l" },
              { bg: "bg-[#EFE2CB]", fg: "text-[#1E1B17]", muted: "text-[#1E1B17]/65", border: "border-[#1E1B17]/25", tilt: "tilt-r" },
            ][i % 4];
            const taller = i % 2 === 0; // altura alternada cria ritmo, diferente de grid uniforme
            return (
              <Link
                key={c.name}
                href={`/categoria/${c.name}`}
                className={`group relative overflow-hidden ${palette.bg} ${palette.fg} ${
                  taller ? "min-h-[220px] md:min-h-[360px]" : "min-h-[180px] md:min-h-[300px] md:mt-8"
                } p-4 md:p-6 flex flex-col justify-between`}
              >
                {/* Textura de hachura sutil sobreposta */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 6px)",
                  }}
                />

                {/* Topo: carimbo + contagem */}
                <div className="relative flex items-start justify-between">
                  <span
                    className={`clay-stamp ${palette.tilt} h-8 w-10 md:h-9 md:w-12 text-[10px] md:text-[11px] !bg-transparent !border ${palette.border} ${palette.fg}`}
                  >
                    §{c.index}
                  </span>
                  <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.3em] tabular-nums ${palette.muted}`}>
                    {c.count > 0 ? `${String(c.count).padStart(2, "0")} pç` : "em breve"}
                  </span>
                </div>

                {/* Nome gigante embaixo */}
                <div className="relative">
                  <div className="gothic text-5xl md:text-7xl leading-[0.85] tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
                    {c.label}
                  </div>
                  <div className={`mt-3 md:mt-4 h-px w-10 md:w-14 origin-left ${palette.fg.replace("text-", "bg-")} transition-transform duration-500 group-hover:scale-x-[6]`} />
                  <div className="mt-2 flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.28em]">
                    <span>ver linha</span>
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </Reveal>

        {/* Faixa Kits — mesma forma da faixa Lookbook (organiza o mobile: grade 2×2 + faixas) */}
        <Reveal>
        <Link
          href="/categoria/Kits"
          className="group relative mt-2 md:mt-3 flex items-center justify-between gap-4 bg-ink text-background px-4 md:px-8 py-5 md:py-7 overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.18] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 6px)",
            }}
          />
          <div className="relative flex items-baseline gap-3 md:gap-5 min-w-0">
            <span className="brand-mark text-[10px] md:text-xs uppercase tracking-[0.32em] text-background/60">§04</span>
            <span className="gothic text-3xl md:text-5xl leading-none">Kits</span>
            <span className="editorial hidden md:inline text-sm text-background/70">
              {kitsCount > 0 ? `${kitsCount} ${kitsCount === 1 ? "peça" : "peças"}` : "em breve"}
            </span>
          </div>
          <span
            aria-hidden
            className="relative inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-background/40 transition-all duration-300 group-hover:bg-background group-hover:text-ink"
          >
            →
          </span>
        </Link>
        </Reveal>

        {/* Faixa Lookbook — banda horizontal larga, contraste com os patches quadrados */}
        <Reveal>
        <Link
          href="/lookbook"
          className="group relative mt-2 md:mt-3 flex items-center justify-between gap-4 bg-ink text-background px-4 md:px-8 py-5 md:py-7 overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.18] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 6px)",
            }}
          />
          <div className="relative flex items-baseline gap-3 md:gap-5 min-w-0">
            <span className="brand-mark text-[10px] md:text-xs uppercase tracking-[0.32em] text-background/60">§00</span>
            <span className="gothic text-3xl md:text-5xl leading-none">Lookbook</span>
            <span className="editorial hidden md:inline text-sm text-background/70">ed. 01 · rua</span>
          </div>
          <span
            aria-hidden
            className="relative inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-background/40 transition-all duration-300 group-hover:bg-background group-hover:text-ink"
          >
            →
          </span>
        </Link>
        </Reveal>
      </section>

      {/* ===================== GRADE DE PRODUTOS ===================== */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-xl md:text-3xl font-medium leading-tight tracking-tight">
              Peças <span className="editorial">em&nbsp;destaque</span>
            </h2>
          </div>
          <Link
            href="/categoria/Blusas"
            className="accent-underline text-xs md:text-sm uppercase tracking-widest text-muted hover:text-foreground nudge-down-2"
          >
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-6 md:gap-y-10">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70}>
              <ProductCard
                slug={p.slug}
                name={p.name}
                category={p.category}
                priceCents={p.priceCents}
                image={p.images[0]?.url ?? ""}
                imageHover={p.images[1]?.url}
                rating={p.rating}
                reviewCount={p.reviewCount}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== MANIFESTO — banner em tinta de xilogravura ===================== */}
      <section className="ink-section cordel-edge overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-5 md:px-10 py-16 md:py-28 grid grid-cols-12 gap-x-4">
          <div className="col-span-12 md:col-span-2 hidden md:block">
            <div className="brand-mark text-5xl text-white/30 leading-none tilt-l">
              §04
            </div>
          </div>

          <Reveal className="col-span-12 md:col-span-9 md:col-start-3">
            <p className="gothic mt-2 md:mt-0 text-5xl md:text-8xl text-white leading-[0.88]">
              Norte é <span className="editorial">direção</span>.
              <br />
              <span className="inline-block pl-6 md:pl-14">
                Nordeste é{" "}
                <span className="scribble scribble-white editorial">raiz</span>.
              </span>
            </p>

            <div className="mt-8 md:mt-10 flex items-start gap-5 max-w-2xl">
              <div className="hatch-rule-uneven w-20 md:w-28 mt-3 opacity-90 shrink-0 tilt-micro-r" />
              <p className="text-sm md:text-lg leading-relaxed text-white/70">
                Feito pelo nordeste, pra quem usa a rua como passarela. Sem
                pressa de drop. Sem moda passageira.
              </p>
            </div>

          </Reveal>
        </div>
      </section>

      {/* ===================== ONDE A GENTE ESTÁ — mapa + Google Meu Negócio ===================== */}
      <section className="border-t border-line bg-background">
        <Reveal className="mx-auto max-w-7xl px-4 md:px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 md:gap-12 items-stretch">
          <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left">
            <h2 className="gothic text-4xl md:text-6xl leading-[0.92] tracking-tight">
              Limoeiro do<br />Norte, Ceará.
            </h2>

            <div className="mt-7 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href={GMN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-trace btn-outline inline-flex items-center gap-2.5 bg-foreground text-background px-5 md:px-6 py-3 text-[11px] md:text-xs uppercase tracking-widest rounded-md hover:bg-foreground/90 transition-colors"
              >
                <GoogleIcon className="h-4 w-4 rounded-full bg-white p-[1px]" />
                Ver no Google
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  "Limoeiro do Norte, CE, Brasil",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="accent-underline text-[11px] md:text-xs uppercase tracking-widest text-muted hover:text-foreground"
              >
                Como chegar
              </a>
              <img
                src="/selo-de-verificacao.jpg"
                alt="Perfil verificado pelo Google"
                title="Perfil verificado pelo Google"
                className="h-10 w-10 md:h-12 md:w-12 object-contain"
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md w-full mx-auto md:mx-0 text-[11px] md:text-xs text-left">
              <div className="rounded-md border border-line p-3.5">
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted">Cidade</div>
                <div className="mt-1 font-medium">Limoeiro do Norte, CE</div>
              </div>
              <div className="rounded-md border border-line p-3.5">
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted">Atendimento</div>
                <div className="mt-1 font-medium">Seg a sáb · 9h às 19h</div>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden rounded-md border border-line bg-surface">
            <iframe
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa da HYPADO em Limoeiro do Norte, CE"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
            />
            <a
              href={GMN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-[10px] md:text-[11px] font-medium shadow-md hover:bg-white transition-colors"
            >
              <GoogleIcon className="h-3.5 w-3.5" />
              Google Meu Negócio
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M22.5 12.25c0-.85-.08-1.66-.22-2.45H12v4.64h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.27-4.74 3.27-8.29Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.78.42 3.47 1.18 4.95l3.66-2.85Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.13 14.96 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}
