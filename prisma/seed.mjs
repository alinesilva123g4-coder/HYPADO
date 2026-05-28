import { PrismaClient } from "@prisma/client";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const PRODUCTS_DIR = join(process.cwd(), "public", "products");

const CATEGORY_META = {
  Blusas: { priceCents: 12900, sizes: ["P", "M", "G", "GG"], description: "Blusa premium da linha HYPADO. Modelagem oversized, algodão pesado." },
  Camisetas: { priceCents: 8900, sizes: ["P", "M", "G", "GG"], description: "Camiseta HYPADO em algodão peruano. Acabamento premium e caimento perfeito." },
  Chinelas: { priceCents: 5900, sizes: ["38", "39", "40", "41", "42", "43"], description: "Chinela HYPADO. Conforto e identidade do nordeste no design." },
  Kits: { priceCents: 19900, sizes: ["P", "M", "G", "GG"], description: "Kit HYPADO com peças combinadas. Streetwear nordestino em conjunto completo." },
  Shorts: { priceCents: 9900, sizes: ["P", "M", "G", "GG"], description: "Short HYPADO de tactel premium. Caimento moderno, conforto pra qualquer rolê." },
};

const NAME_HINTS = {
  Blusas: ["Blusa Norte", "Blusa Maré", "Blusa Sertão", "Blusa Litoral", "Blusa Brisa", "Blusa Areia", "Blusa Dunas", "Blusa Caju", "Blusa Coco", "Blusa Maracatu", "Blusa Forró", "Blusa Frevo", "Blusa Cangaço", "Blusa Recife", "Blusa Olinda", "Blusa Salvador"],
  Camisetas: ["Camiseta Essential"],
  Chinelas: ["Chinela Brisa"],
  Kits: ["Kit Nordeste", "Kit Litoral", "Kit Sertão", "Kit Maré", "Kit Dunas", "Kit Cangaço", "Kit Frevo", "Kit Maracatu", "Kit Caju", "Kit Coco", "Kit Recife", "Kit Olinda"],
  Shorts: ["Short Maré", "Short Brisa", "Short Litoral", "Short Areia", "Short Coco", "Short Caju", "Short Sertão", "Short Norte"],
};

function listDirs(p) {
  return readdirSync(p).filter((f) => statSync(join(p, f)).isDirectory()).sort();
}
function listFiles(p) {
  return readdirSync(p).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
}

async function main() {
  await prisma.event.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  const categories = listDirs(PRODUCTS_DIR);
  let created = 0;

  for (const category of categories) {
    const meta = CATEGORY_META[category];
    if (!meta) continue;
    const names = NAME_HINTS[category] || [];
    const productFolders = listDirs(join(PRODUCTS_DIR, category));

    for (let i = 0; i < productFolders.length; i++) {
      const folder = productFolders[i];
      const files = listFiles(join(PRODUCTS_DIR, category, folder));
      if (files.length === 0) continue;

      const name = names[i] || `${category.slice(0, -1)} ${folder}`;
      const slug = `${category.toLowerCase()}-${folder}`;

      await prisma.product.create({
        data: {
          slug,
          name,
          category,
          description: meta.description,
          priceCents: meta.priceCents,
          images: {
            create: files.map((f, idx) => ({
              url: `/products/${category}/${folder}/${f}`,
              position: idx,
            })),
          },
          variants: {
            create: meta.sizes.map((s) => ({ size: s, stock: 8 })),
          },
        },
      });
      created++;
    }
  }

  console.log(`Seeded ${created} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
