import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    for (const k of ["name", "slug", "category", "description", "active"]) {
      if (k in body) data[k] = body[k];
    }
    if ("priceCents" in body) data.priceCents = Number(body.priceCents) || 0;
    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "slug_em_uso" }, { status: 409 });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
