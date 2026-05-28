import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { body, authorName } = await req.json();
  if (!body) return NextResponse.json({ error: "missing_body" }, { status: 400 });
  const rp = await prisma.reviewReply.create({
    data: { reviewId: id, authorName: authorName || "HYPADO", body: String(body) },
  });
  return NextResponse.json(rp);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await prisma.reviewReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
