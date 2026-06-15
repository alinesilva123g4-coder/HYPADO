// ============================================================================
// HYPADO · Substituição das camisas (Blusas + Camisetas) pelos produtos novos
// ============================================================================
// 1. Sobe as 13 fotos de public/Novos Produtos pro bucket do Supabase Storage
// 2. Apaga os produtos antigos das categorias Blusas e Camisetas (cascade em
//    ProductImage/Variant). Pré-checado: nenhum tem OrderItem, então é seguro.
// 3. Cria os 13 produtos novos (marcas Baruk e Pow Jeans) com imagem, preço e
//    variantes (só os tamanhos em estoque indicados no nome do arquivo).
//
// Rodar (Node 24 carrega o .env nativamente):
//   cd web
//   node --env-file=.env prisma/replace-camisas.mjs
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "hypado-uploads";
const SRC_DIR = join(process.cwd(), "public", "Novos Produtos");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam envs NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const publicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

// --- Catálogo: 1 produto por foto -----------------------------------------
// file: nome exato em public/Novos Produtos
// sizes: tamanhos em estoque (do nome do arquivo)
const CATALOG = [
  // ---------- Blusas (oversized + texturizadas) ----------
  {
    category: "Blusas",
    name: "Baruk Oversized Vermelho",
    slug: "baruk-oversized-vermelho",
    priceCents: 12000,
    sizes: ["M"],
    file: "M overzied 120$ Baruk.jpeg",
    description: "Camiseta oversized Baruk Brand na cor vermelha com detalhe de vivo branco e assinatura bordada no peito. Algodão pesado, caimento amplo.",
  },
  {
    category: "Blusas",
    name: "Baruk Oversized Preto Floral",
    slug: "baruk-oversized-preto-floral",
    priceCents: 12000,
    sizes: ["P", "M"],
    file: "PM Oversized 120$ Baruk.jpeg",
    description: "Oversized Baruk Brand preta com monograma floral rosa estampado nas costas. Streetwear de impacto, modelagem ampla.",
  },
  {
    category: "Blusas",
    name: "Oversized Preto Essential",
    slug: "oversized-preto-essential",
    priceCents: 9000,
    sizes: ["P"],
    file: "Oversized 90 P.jpeg",
    description: "Oversized preta minimalista com logo holográfico no peito. Básica premium pra montar qualquer look.",
  },
  {
    category: "Blusas",
    name: "Camisa Texturizada Baruk Areia",
    slug: "camisa-texturizada-baruk-areia",
    priceCents: 14000,
    sizes: ["M"],
    file: "Camisa texturizada Baruk M 140,00$.jpeg",
    description: "Camisa de tricô texturizado Baruk Brand off-white com listras verticais areia e preto. Trama vazada, peça statement.",
  },
  {
    category: "Blusas",
    name: "Camisa Texturizada Baruk Azul",
    slug: "camisa-texturizada-baruk-azul",
    priceCents: 14000,
    sizes: ["M"],
    file: "Camisa texturizada Baruk M 140,00.jpeg",
    description: "Camisa de tricô texturizado Baruk Brand creme com listras verticais em tons de azul. Trama vazada, acabamento premium.",
  },

  // ---------- Camisetas (Pow Jeans + Baruk Long) ----------
  {
    category: "Camisetas",
    name: "Pow Jeans Rose",
    slug: "pow-jeans-rose",
    priceCents: 8500,
    sizes: ["P", "M", "G"],
    file: "WhatsApp Image 2026-06-02 at 18.52.0.jpeg",
    description: "Camiseta Pow Jeans azul royal com estampa de rosa e lettering gótico nas costas. Algodão, caimento regular.",
  },
  {
    category: "Camisetas",
    name: "Pow Jeans Bunny",
    slug: "pow-jeans-bunny",
    priceCents: 8500,
    sizes: ["G"],
    file: "G 85$ pow jeans long.jpeg",
    description: "Camiseta Pow Jeans azul royal com estampa do coelho assinatura nas costas. Algodão, caimento regular.",
  },
  {
    category: "Camisetas",
    name: "Pow Jeans Tiger",
    slug: "pow-jeans-tiger",
    priceCents: 8500,
    sizes: ["M"],
    file: "M 85$ pow jeans long 01.jpeg",
    description: "Camiseta Pow Jeans preta com estampa retrato e tigre em moldura dourada nas costas. Algodão, caimento regular.",
  },
  {
    category: "Camisetas",
    name: "Pow Jeans Angel Money",
    slug: "pow-jeans-angel-money",
    priceCents: 8500,
    sizes: ["M"],
    file: "M 85$ pow jeans long.jpeg",
    description: "Camiseta Pow Jeans preta com estampa de anjo e sacos de dinheiro nas costas. Algodão, caimento regular.",
  },
  {
    category: "Camisetas",
    name: "Pow Jeans Angel Cálice",
    slug: "pow-jeans-angel-calice",
    priceCents: 8500,
    sizes: ["P", "M"],
    file: "M e P 85 pow jeans lonh.jpeg",
    description: "Camiseta Pow Jeans preta com estampa de anjo segurando cálice e lettering vermelho nas costas. Algodão, caimento regular.",
  },
  {
    category: "Camisetas",
    name: "Baruk Long Marrom",
    slug: "baruk-long-marrom",
    priceCents: 9000,
    sizes: ["M", "G"],
    file: "M e G Baruk long 90$.jpeg",
    description: "Camiseta Baruk Brand marrom com monograma e lettering circular nas costas. Algodão, caimento regular long.",
  },
  {
    category: "Camisetas",
    name: "Baruk Long Bege",
    slug: "baruk-long-bege",
    priceCents: 9000,
    sizes: ["P", "M"],
    file: "M e P long Baruk 90$.jpeg",
    description: "Camiseta Baruk Brand bege com faixa BARUK no peito e monograma bordado. Algodão, caimento regular long.",
  },
  {
    category: "Camisetas",
    name: "Baruk Long Off-white",
    slug: "baruk-long-off-white",
    priceCents: 9000,
    sizes: ["P", "M"],
    file: "M e P long Baruk 90,00$.jpeg",
    description: "Camiseta Baruk Brand off-white com estampa drink e lettering rosa/azul nas costas. Algodão, caimento regular long.",
  },
];

async function ensureBucket() {
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) throw new Error(`Não consegui criar o bucket "${BUCKET}": ${error.message}`);
  console.log(`Bucket "${BUCKET}" criado (público).`);
}

async function uploadImage(item) {
  const buf = await readFile(join(SRC_DIR, item.file));
  const path = `products/${item.slug}-${Date.now().toString(36)}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Upload falhou (${item.file}): ${error.message}`);
  return publicUrl(path);
}

async function main() {
  await ensureBucket();

  // 1) apagar camisas antigas (Blusas + Camisetas)
  const antigas = await prisma.product.findMany({
    where: { category: { in: ["Blusas", "Camisetas"] } },
    select: { id: true, _count: { select: { orderItems: true } } },
  });
  const comPedido = antigas.filter((p) => p._count.orderItems > 0);
  if (comPedido.length > 0) {
    throw new Error(`${comPedido.length} produto(s) antigos têm pedidos — abortando pra não quebrar histórico.`);
  }
  const ids = antigas.map((p) => p.id);
  const del = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log(`Apagados ${del.count} produtos antigos (Blusas + Camisetas).`);

  // 2) subir imagens + criar produtos novos
  let created = 0;
  for (const item of CATALOG) {
    const url = await uploadImage(item);
    await prisma.product.create({
      data: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        description: item.description,
        priceCents: item.priceCents,
        active: true,
        images: { create: [{ url, position: 0 }] },
        variants: { create: item.sizes.map((s) => ({ size: s, stock: 8 })) },
      },
    });
    created++;
    console.log(`  + ${item.category} · ${item.name} (${item.sizes.join("/")}) — ${url}`);
  }

  console.log(`\nPronto: ${created} produtos novos criados.`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
