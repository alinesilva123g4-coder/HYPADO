import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const revalidate = 120;
export const metadata = { title: "Lookbook · HYPADO" };

export default async function LookbookPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 16,
  });

  const shots = products.flatMap((p) =>
    p.images[0] ? [{ id: p.id, slug: p.slug, name: p.name, url: p.images[0].url }] : []
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-10">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted">Lookbook</div>
        <h1 className="gothic mt-3 md:mt-4 text-5xl md:text-7xl">Drop 01</h1>
        <p className="mt-3 md:mt-4 text-xs md:text-sm text-muted max-w-xl">
          Coleção atual em foto. Toca pra ver a peça.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-14 md:pb-24">
        <div className="columns-2 md:columns-3 gap-2 md:gap-4 [column-fill:_balance]">
          {shots.map((s, i) => (
            <Link
              key={s.id}
              href={`/produto/${s.slug}`}
              className="mb-2 md:mb-4 block break-inside-avoid relative overflow-hidden rounded-md bg-surface"
              style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 4 === 0 ? "1/1" : "4/5" }}
            >
              <Image
                src={s.url}
                alt={s.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
