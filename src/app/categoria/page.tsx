import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Categorias · HYPADO",
  description: "Streetwear nordestino premium. Escolha sua categoria.",
};

const CATEGORIES = ["Blusas", "Camisetas", "Calças", "Shorts", "Chinelas", "Kits"] as const;

const TAGLINES: Record<(typeof CATEGORIES)[number], string> = {
  Blusas: "Modelagem oversized, algodão pesado.",
  Camisetas: "Algodão peruano, caimento premium.",
  Calças: "Jeans skinny premium, caimento que valoriza.",
  Shorts: "Tactel premium, leve pra qualquer rolê.",
  Chinelas: "Conforto absurdo, identidade nordestina.",
  Kits: "Looks completos, streetwear em conjunto.",
};

export default async function CategoriesIndexPage() {
  const counts = await prisma.product.groupBy({
    by: ["category"],
    where: { active: true },
    _count: { _all: true },
  });

  const firstImages = await prisma.product.findMany({
    where: { active: true },
    select: {
      category: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  const coverByCategory = firstImages.reduce<Record<string, string>>(
    (acc, p) => {
      if (p.images[0]?.url && !acc[p.category]) acc[p.category] = p.images[0].url;
      return acc;
    },
    {},
  );

  const countByCategory = counts.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = c._count._all;
    return acc;
  }, {});

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 pb-4 md:pb-6">
        <nav className="text-[10px] uppercase tracking-[0.3em] text-muted flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <span className="text-foreground">Categorias</span>
        </nav>
        <h1 className="gothic mt-3 md:mt-4 text-5xl md:text-7xl">Categorias</h1>
        <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted max-w-xl">
          Escolha onde quer começar. Streetwear nordestino, feito pra rua.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-14 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {CATEGORIES.map((name) => {
            const count = countByCategory[name] ?? 0;
            const cover = coverByCategory[name];
            return (
              <Link
                key={name}
                href={`/categoria/${name}`}
                className="group relative aspect-[4/5] overflow-hidden bg-surface rounded-md border border-line"
              >
                {cover && (
                  <Image
                    src={cover}
                    alt={name}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-background">
                  <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] opacity-80">
                    {count} {count === 1 ? "peça" : "peças"}
                  </div>
                  <h2 className="gothic text-3xl md:text-4xl mt-1">{name}</h2>
                  <p className="mt-1 text-[11px] md:text-xs opacity-80 line-clamp-1">
                    {TAGLINES[name]}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
