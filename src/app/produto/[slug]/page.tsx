import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "./ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { size: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { category: product.category, NOT: { id: product.id }, active: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 2 },
      reviews: { select: { rating: true } },
    },
    take: 4,
  });

  const relatedWithRating = related.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { ...p, rating: avg, reviewCount: count };
  });

  return <ProductDetail product={product} related={relatedWithRating} />;
}
