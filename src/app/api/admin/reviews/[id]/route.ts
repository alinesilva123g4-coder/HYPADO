import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if ("verified" in body) data.verified = !!body.verified;
  if ("body" in body) data.body = String(body.body);
  if ("title" in body) data.title = body.title;
  const r = await prisma.review.update({ where: { id }, data });
  return NextResponse.json(r);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
