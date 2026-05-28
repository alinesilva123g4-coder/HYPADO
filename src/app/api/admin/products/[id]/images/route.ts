import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });
  const count = await prisma.productImage.count({ where: { productId: id } });
  const img = await prisma.productImage.create({
    data: { productId: id, url, position: count },
  });
  return NextResponse.json(img);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order } = await req.json();
  if (!Array.isArray(order)) return NextResponse.json({ error: "missing_order" }, { status: 400 });
  await prisma.$transaction(
    order.map((imgId: string, i: number) =>
      prisma.productImage.update({
        where: { id: imgId },
        data: { position: i },
      })
    )
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await prisma.productImage.delete({ where: { id } });
  // recompactar posições
  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
  await prisma.$transaction(
    remaining.map((img, i) =>
      prisma.productImage.update({ where: { id: img.id }, data: { position: i } })
    )
  );
  return NextResponse.json({ ok: true });
}
