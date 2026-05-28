import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 60;

const HERO_IMAGE = "/lifestyle/SaveClip.App_601384381_17988174713878696_2857454434521099802_n.jpg";
const BENTO_LIFESTYLE = "/lifestyle/SaveClip.App_602687501_17988172538878696_8271872521100818131_n.jpg";
const CATEGORIES = ["Blusas", "Shorts", "Kits", "Camisetas"] as const;
const GMN_URL = "https://share.google/l1WSU00AfqlVSQddy";
const MAP_EMBED =
  "https://www.google.com/maps?q=Limoeiro+do+Norte,+CE,+Brasil&z=13&output=embed";

export default async function HomePage() {
  const [productsRaw, categoryAnchors, topReviewsRaw] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        reviews: { select: { rating: true } },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { slug: { in: CATEGORIES.map((c) => `${c.toLowerCase()}-01`) } },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.review.findMany({
      where: { rating: { gte: 4 } },
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  const products = productsRaw.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { ...p, rating: avg, reviewCount: count };
  });

  const anchorBySlug = new Map(categoryAnchors.map((p) => [p.slug, p.images[0]?.url]));
  const categoryTiles = CATEGORIES.map((c, i) => ({
    name: c,
    index: String(i + 1).padStart(2, "0"),
    image: anchorBySlug.get(`${c.toLowerCase()}-01`) ?? HERO_IMAGE,
  }));


  return (
    <>
      {/* ===================== HERO — lifestyle, ancorado à esquerda ===================== */}
      <section className="relative h-[78vh] min-h-[480px] md:h-[90vh] md:min-h-[600px] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="HYPADO · Drop 01"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Scrim quente: tinta no rodapé + calor de sol vindo da esquerda */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_10%_100%,rgba(0,0,0,0.28),transparent_60%)]" />

        <div className="absolute inset-0 mx-auto max-w-7xl px-5 md:px-8 flex flex-col justify-end pb-9 md:pb-16">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3">
              <span className="clay-stamp h-7 w-7 text-[10px] rounded-sm">01</span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] opacity-85">
                north east · Brasil
              </span>
            </div>
            <h1 className="gothic mt-3 md:mt-4 text-6xl md:text-9xl leading-[0.85]">Drop 01</h1>
            <p className="mt-3 md:mt-4 max-w-md text-xs md:text-base opacity-90 leading-relaxed">
              Streetwear nordestino. Coleção limitada. Peças com a raiz do norte,
              cortadas pra rua.
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
                className="accent-underline text-[11px] md:text-xs uppercase tracking-widest text-white/90 hover:text-white"
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
          <div>
            <div className="eyebrow text-[9px] md:text-[10px]">Categorias</div>
            <h2 className="mt-2 text-lg md:text-2xl font-medium">Explorar por linha</h2>
          </div>
          <Link
            href="/categoria/Camisetas"
            className="accent-underline hidden md:inline text-xs uppercase tracking-widest text-muted hover:text-foreground"
          >
            Ver tudo
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-6 md:grid-rows-2 md:gap-3 md:h-[620px] md:[grid-auto-flow:dense]">
          {/* Plate lifestyle — tall, ancora o bento */}
          <Link
            href="/lookbook"
            className="group relative col-span-2 md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto overflow-hidden rounded-md bg-surface"
          >
            <Image
              src={BENTO_LIFESTYLE}
              alt="Lookbook HYPADO"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <div className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-white/75">
                Editorial
              </div>
              <div className="gothic mt-1 text-3xl md:text-5xl text-white leading-none">
                Lookbook
              </div>
              <span className="mt-3 inline-flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-white/90">
                Ver a coleção na rua
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>

          {/* Tiles still — categorias */}
          {categoryTiles.map((c) => (
            <Link
              key={c.name}
              href={`/categoria/${c.name}`}
              className="group relative col-span-1 md:col-span-2 aspect-[3/4] md:aspect-auto overflow-hidden rounded-md bg-surface"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/15 transition-colors duration-300 group-hover:bg-ink/35" />
              {/* Índice de cordel — aparece no hover */}
              <span className="clay-stamp absolute top-2.5 left-2.5 h-6 w-6 text-[9px] rounded-sm opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                {c.index}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 md:p-5">
                <span className="brand-mark text-lg md:text-2xl text-white tracking-wider">
                  {c.name}
                </span>
                <span className="text-white/80 text-sm opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== GRADE DE PRODUTOS ===================== */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <div className="eyebrow text-[9px] md:text-[10px]">Recentes</div>
            <h2 className="mt-2 text-lg md:text-2xl font-medium">Peças em destaque</h2>
          </div>
          <Link
            href="/categoria/Blusas"
            className="accent-underline text-xs md:text-sm uppercase tracking-widest text-muted hover:text-foreground"
          >
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-6 md:gap-y-10">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              category={p.category}
              priceCents={p.priceCents}
              image={p.images[0]?.url ?? ""}
              imageHover={p.images[1]?.url}
              rating={p.rating}
              reviewCount={p.reviewCount}
            />
          ))}
        </div>
      </section>

      {/* ===================== MANIFESTO — banner em tinta de xilogravura ===================== */}
      <section className="ink-section cordel-edge">
        <div className="mx-auto max-w-4xl px-5 md:px-6 py-16 md:py-28 text-center">
          <div className="eyebrow text-[9px] md:text-[10px] text-white/70 justify-center [&::before]:bg-ochre">
            Manifesto
          </div>
          <p className="gothic mt-6 md:mt-8 text-4xl md:text-7xl text-white leading-[0.9]">
            Norte é direção.
            <br />
            Nordeste é raiz.
          </p>
          <div className="hatch-rule mx-auto mt-7 md:mt-9 max-w-[120px] opacity-90" />
          <p className="mt-6 md:mt-8 text-sm md:text-lg leading-relaxed text-white/70 max-w-xl mx-auto">
            Feito pelo nordeste, pra quem usa a rua como passarela. Sem pressa de
            drop. Sem moda passageira.
          </p>
        </div>
      </section>

      {/* ===================== ONDE A GENTE ESTÁ — mapa + Google Meu Negócio ===================== */}
      <section className="border-t border-line bg-background">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 md:gap-12 items-stretch">
          <div className="flex flex-col justify-center">
            <h2 className="gothic text-4xl md:text-6xl leading-[0.92] tracking-tight">
              Limoeiro do<br />Norte, Ceará.
            </h2>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={GMN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-trace btn-outline inline-flex items-center gap-2.5 bg-foreground text-background px-5 md:px-6 py-3 text-[11px] md:text-xs uppercase tracking-widest rounded-md hover:bg-foreground/90 transition-colors"
              >
                <GoogleIcon className="h-4 w-4 [filter:brightness(0)_invert(1)]" />
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
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md text-[11px] md:text-xs">
              <div className="rounded-md border border-line p-3.5">
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted">Cidade</div>
                <div className="mt-1 font-medium">Limoeiro do Norte, CE</div>
              </div>
              <div className="rounded-md border border-line p-3.5">
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted">Atendimento</div>
                <div className="mt-1 font-medium">Seg a sex · 9h às 18h</div>
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
        </div>
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
