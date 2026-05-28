import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const rating = Number(data.rating);
    const authorName = String(data.authorName ?? "").trim();
    const body = String(data.body ?? "").trim();
    const title = String(data.title ?? "").trim() || null;
    const city = String(data.city ?? "").trim() || null;
    const productId = String(data.productId ?? "").trim();
    const mediaArr = Array.isArray(data.media) ? data.media : [];
    const media = mediaArr
      .filter(
        (m: { url?: unknown; type?: unknown }) =>
          m &&
          typeof m.url === "string" &&
          (m.type === "image" || m.type === "video"),
      )
      .slice(0, 6);

    if (!productId) return NextResponse.json({ error: "missing_product" }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
    }
    if (authorName.length < 2 || authorName.length > 80) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    if (body.length < 4 || body.length > 1200) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        rating,
        authorName,
        body,
        title,
        city,
        verified: false,
        media: media.length > 0 ? JSON.stringify(media) : null,
      },
    });

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "missing_product" }, { status: 400 });
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}
