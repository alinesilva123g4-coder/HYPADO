import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, category, description, priceCents, active } = body;
    if (!name || !slug || !category) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        category,
        description: description || "",
        priceCents: Number(priceCents) || 0,
        active: !!active,
      },
    });
    return NextResponse.json(product);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "slug_em_uso" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
