import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `review-react:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const { id: reviewId } = await params;
  const { kind, sessionId } = await req.json();

  if (!["like", "dislike"].includes(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.reviewReaction.findUnique({
      where: { reviewId_sessionId: { reviewId, sessionId } },
    });

    let myReaction: "like" | "dislike" | null = kind;

    if (!existing) {
      await tx.reviewReaction.create({ data: { reviewId, sessionId, kind } });
      await tx.review.update({
        where: { id: reviewId },
        data: kind === "like" ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } },
      });
    } else if (existing.kind === kind) {
      await tx.reviewReaction.delete({ where: { id: existing.id } });
      await tx.review.update({
        where: { id: reviewId },
        data: kind === "like" ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
      });
      myReaction = null;
    } else {
      await tx.reviewReaction.update({ where: { id: existing.id }, data: { kind } });
      await tx.review.update({
        where: { id: reviewId },
        data:
          kind === "like"
            ? { likes: { increment: 1 }, dislikes: { decrement: 1 } }
            : { likes: { decrement: 1 }, dislikes: { increment: 1 } },
      });
    }

    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: { likes: true, dislikes: true },
    });

    return {
      likes: Math.max(0, review?.likes ?? 0),
      dislikes: Math.max(0, review?.dislikes ?? 0),
      myReaction,
    };
  });

  return NextResponse.json(result);
}
