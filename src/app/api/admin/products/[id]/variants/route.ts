import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { size, stock } = await req.json();
    if (!size) return NextResponse.json({ error: "missing_size" }, { status: 400 });
    const v = await prisma.variant.create({
      data: { productId: id, size: String(size), stock: Number(stock) || 0 },
    });
    return NextResponse.json(v);
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "tamanho_duplicado" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  const { id, stock, size } = await req.json();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const existing = await prisma.variant.findUnique({ where: { id } });
  if (!existing || existing.productId !== productId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: { stock?: number; size?: string } = {};
  if (typeof stock === "number") data.stock = stock;
  if (size) data.size = String(size);
  const v = await prisma.variant.update({ where: { id }, data });
  return NextResponse.json(v);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const existing = await prisma.variant.findUnique({ where: { id } });
  if (!existing || existing.productId !== productId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.variant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
