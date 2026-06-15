import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `review-reply:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const { id: reviewId } = await params;
  const data = await req.json();
  const authorName = String(data.authorName ?? "").trim();
  const body = String(data.body ?? "").trim();

  if (authorName.length < 2 || authorName.length > 80) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (body.length < 2 || body.length > 800) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const reply = await prisma.reviewReply.create({
    data: { reviewId, authorName, body },
  });

  return NextResponse.json({ reply });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reviewId } = await params;
  const replies = await prisma.reviewReply.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ replies });
}
