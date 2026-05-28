import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../_components/ProductForm";
import { ImageManager } from "../_components/ImageManager";
import { VariantManager } from "../_components/VariantManager";
import { DeleteProductButton } from "../_components/DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { size: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">/{product.slug}</p>
        </div>
        <DeleteProductButton id={product.id} />
      </header>

      <div className="space-y-6">
        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4">Dados do produto</h2>
          <ProductForm
            mode="edit"
            initial={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              category: product.category,
              description: product.description,
              priceCents: product.priceCents,
              active: product.active,
            }}
          />
        </section>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4">Imagens</h2>
          <ImageManager
            productId={product.id}
            images={product.images.map((i) => ({ id: i.id, url: i.url, position: i.position }))}
          />
        </section>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4">Estoque por tamanho</h2>
          <VariantManager
            productId={product.id}
            variants={product.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock }))}
          />
        </section>
      </div>
    </div>
  );
}
