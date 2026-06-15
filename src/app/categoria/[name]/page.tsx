import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryViewTracker } from "./CategoryViewTracker";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

const VALID = ["Blusas", "Camisetas", "Calças", "Shorts", "Chinelas", "Kits"] as const;
type Category = (typeof VALID)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const category = normalize(name);
  if (!category) return { title: "Categoria" };
  const url = `${SITE_URL}/categoria/${encodeURIComponent(category)}`;
  const title = `${category} · ${SITE_NAME}`;
  const description = TAGLINES[category];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
  };
}

const TAGLINES: Record<Category, string> = {
  Blusas: "Modelagem oversized, algodão pesado.",
  Camisetas: "Algodão peruano, caimento premium.",
  Calças: "Jeans skinny premium, caimento que valoriza.",
  Shorts: "Tactel premium, leve pra qualquer rolê.",
  Chinelas: "Conforto absurdo, identidade nordestina.",
  Kits: "Looks completos, streetwear em conjunto.",
};

function normalize(input: string): Category | null {
  const lower = decodeURIComponent(input).toLowerCase();
  const match = VALID.find((c) => c.toLowerCase() === lower);
  return match ?? null;
}

export async function generateStaticParams() {
  return VALID.map((name) => ({ name }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const category = normalize(name);
  if (!category) notFound();

  const productsRaw = await prisma.product.findMany({
    where: { category, active: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 2 },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = productsRaw.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { ...p, rating: avg, reviewCount: count };
  });

  return (
    <>
      <CategoryViewTracker category={category} count={products.length} />
      {/* Header da categoria */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 pb-4 md:pb-6">
        <nav className="text-[10px] uppercase tracking-[0.3em] text-muted flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <span className="text-foreground">{category}</span>
        </nav>
        <h1 className="gothic mt-3 md:mt-4 text-5xl md:text-7xl">{category}</h1>
        <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted max-w-xl">
          {TAGLINES[category]}
        </p>
        <p className="mt-2 text-[11px] md:text-xs text-muted">
          {products.length} {products.length === 1 ? "peça" : "peças"} disponíveis
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-14 md:pb-24">
        {products.length === 0 ? (
          <div className="border border-line p-10 md:p-16 text-center bg-surface rounded-md">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight">
              Sem peças disponíveis no momento.
            </h2>
            <p className="mt-2 text-xs md:text-sm text-muted">
              Drop limitado · esgotou rapidinho. Acompanha o próximo na home.
            </p>
            <Link
              href="/"
              className="btn-trace mt-6 inline-block bg-foreground text-background px-6 py-3 text-[11px] md:text-xs uppercase tracking-widest hover:bg-foreground/90 rounded-md"
            >
              Voltar à home
            </Link>
          </div>
        ) : (
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
        )}
      </section>
    </>
  );
}
