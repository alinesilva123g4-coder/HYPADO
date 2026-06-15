import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Dados mínimos de cartão de produto, buscados por slug.
// Usado pelo chat (Heitor) para montar o carrossel de produtos recomendados.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("slugs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (slugs.length === 0) return NextResponse.json({ products: [] });

  try {
    const rows = await prisma.product.findMany({
      where: { slug: { in: slugs }, active: true },
      select: {
        slug: true,
        name: true,
        category: true,
        priceCents: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    });

    // Preserva a ordem pedida (relevância definida pelo Heitor).
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    const products = slugs
      .map((s) => bySlug.get(s))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        category: r.category,
        priceCents: r.priceCents,
        image: r.images[0]?.url ?? null,
      }));

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
