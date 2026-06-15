import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "./ProductDetail";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  if (!product) return { title: "Produto não encontrado" };

  const img = product.images[0]?.url;
  const title = `${product.name} · ${product.category}`;
  const description =
    product.description.slice(0, 160) ||
    `${product.name} — coleção ${SITE_NAME}.`;
  const url = `${SITE_URL}/produto/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: img ? [img] : undefined,
    },
  };
}

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

  const reviewCount = product.reviews.length;
  const avgRating =
    reviewCount > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  const inStock = product.variants.some((v) => v.stock > 0);
  const url = `${SITE_URL}/produto/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    category: product.category,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount,
      },
      review: product.reviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        author: { "@type": "Person", name: r.authorName },
        datePublished: r.createdAt.toISOString(),
        ...(r.title && { name: r.title }),
        reviewBody: r.body,
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} related={relatedWithRating} />
    </>
  );
}
