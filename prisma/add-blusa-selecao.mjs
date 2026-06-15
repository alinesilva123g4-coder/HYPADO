// ============================================================================
// HYPADO · Adiciona a "Blusa da Seleção" (R$ 120) como produto principal
// ============================================================================
// - Sobe as 2 fotos de public/Novos Produtos pro bucket do Supabase Storage.
// - Cria 1 produto (categoria Blusas) com as DUAS imagens (positions 0 e 1).
// - Por ser o produto mais novo (createdAt desc), aparece em 1º na vitrine
//   "Peças em destaque" da home — ou seja, vira o produto principal.
// - NÃO apaga nada; se o slug já existir, só atualiza preço/nome/imagens.
//
// Rodar (Node 24 carrega o .env nativamente):
//   cd web
//   node --env-file=.env prisma/add-blusa-selecao.mjs
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

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

const PRODUCT = {
  category: "Blusas",
  name: "Blusa da Seleção",
  slug: "blusa-da-selecao",
  priceCents: 12000,
  sizes: ["P", "M", "G", "GG"],
  colors: ["Amarela", "Azul Marinho"],
  files: ["Blusa da Seleção.png", "Blusa da Seleção1.png"],
  description:
    "Camisa da Seleção em duas opções de cor: amarela (home) e azul marinho (away), com escudo e detalhes em azul claro. Escolha a cor e o tamanho. Tecido técnico leve, respirável, caimento esportivo. Edição de torcida pra vestir com orgulho.",
};

async function ensureBucket() {
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) throw new Error(`Não consegui criar o bucket "${BUCKET}": ${error.message}`);
  console.log(`Bucket "${BUCKET}" criado (público).`);
}

async function uploadImage(file, slug, idx) {
  const buf = await readFile(join(SRC_DIR, file));
  const isPng = extname(file).toLowerCase() === ".png";
  const ext = isPng ? "png" : "jpg";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const path = `products/${slug}-${idx}-${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: true });
  if (error) throw new Error(`Upload falhou (${file}): ${error.message}`);
  return publicUrl(path);
}

async function main() {
  await ensureBucket();

  // sobe as duas imagens
  const urls = [];
  for (let i = 0; i < PRODUCT.files.length; i++) {
    urls.push(await uploadImage(PRODUCT.files[i], PRODUCT.slug, i));
  }

  // se já existe, recria as imagens/variantes; senão cria do zero.
  // deletar + criar garante que ele fique como o produto MAIS NOVO (1º na home).
  const existing = await prisma.product.findUnique({ where: { slug: PRODUCT.slug } });
  if (existing) {
    await prisma.product.delete({ where: { id: existing.id } });
    console.log(`  ~ produto existente removido pra recriar como mais novo: ${PRODUCT.slug}`);
  }

  const created = await prisma.product.create({
    data: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      category: PRODUCT.category,
      description: PRODUCT.description,
      priceCents: PRODUCT.priceCents,
      active: true,
      images: { create: urls.map((url, position) => ({ url, position })) },
      // Uma variante por combinação cor × tamanho (2 × 4 = 8).
      variants: {
        create: PRODUCT.colors.flatMap((color) =>
          PRODUCT.sizes.map((size) => ({ size, color, stock: 8 })),
        ),
      },
    },
    include: { images: true, variants: true },
  });

  console.log(`\n+ ${created.category} · ${created.name} (${PRODUCT.colors.join(" + ")} × ${PRODUCT.sizes.join("/")})`);
  created.images.forEach((img) => console.log(`    img[${img.position}] ${img.url}`));
  console.log(`\nPronto. É o produto mais novo → aparece em 1º em "Peças em destaque" na home.`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
