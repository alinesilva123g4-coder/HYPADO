import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const ALLOWED = new Set([
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "lead_captured",
  "category_view",
]);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `events:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "bad_body" }, { status: 400 });
    }

    const { type, sessionId, path, productId, meta } = body as {
      type?: string;
      sessionId?: string;
      path?: string;
      productId?: string;
      meta?: string;
    };

    if (!type || !ALLOWED.has(type)) {
      return NextResponse.json({ error: "bad_type" }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "bad_session" }, { status: 400 });
    }

    await prisma.event.create({
      data: {
        type,
        sessionId: sessionId.slice(0, 64),
        path: path?.slice(0, 200),
        productId: productId?.slice(0, 64),
        meta: meta?.slice(0, 1000),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("events route error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
