// ============================================================================
// HYPADO · Adiciona os produtos novos: Calças (R$ 145) e Shorts (R$ 90)
// ============================================================================
// 1. Sobe as 5 fotos de public/Novos Produtos/{Calças R$ 145, Shorts R$ 90}
//    pro bucket do Supabase Storage.
// 2. Cria os 5 produtos novos (3 calças jeans + 2 shorts Pow Jeans) com imagem,
//    preço e variantes (numeração 38–46, estoque 8 cada).
//    NÃO apaga nada — é puramente aditivo.
//
// Rodar (Node 24 carrega o .env nativamente):
//   cd web
//   node --env-file=.env prisma/add-calcas-shorts.mjs
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

const SIZES = ["38", "40", "42", "44", "46"];

// --- Catálogo: 1 produto por foto -----------------------------------------
// file: caminho relativo a public/Novos Produtos
const CATALOG = [
  // ---------- Calças (jeans skinny · R$ 145) ----------
  {
    category: "Calças",
    name: "Calça Skinny Black",
    slug: "calca-skinny-black",
    priceCents: 14500,
    file: "Calças R$ 145/1.png",
    description: "Calça jeans skinny preta lisa, lavagem uniforme. Caimento ajustado da coxa ao tornozelo, cinco bolsos. Streetwear versátil pra montar qualquer look.",
  },
  {
    category: "Calças",
    name: "Calça Skinny Grafite Used",
    slug: "calca-skinny-grafite-used",
    priceCents: 14500,
    file: "Calças R$ 145/2.png",
    description: "Calça jeans skinny grafite com lavagem used e leves desbotados. Caimento ajustado, cinco bolsos. Atitude pra rua.",
  },
  {
    category: "Calças",
    name: "Calça Skinny Cinza Stone",
    slug: "calca-skinny-cinza-stone",
    priceCents: 14500,
    file: "Calças R$ 145/3.png",
    description: "Calça jeans skinny cinza claro com lavagem stone marcada e bigodes naturais. Caimento ajustado, cinco bolsos. Peça statement.",
  },

  // ---------- Shorts (Pow Jeans · R$ 90) ----------
  {
    category: "Shorts",
    name: "Short Pow Jeans Black",
    slug: "short-pow-jeans-black",
    priceCents: 9000,
    file: "Shorts R$ 90/WhatsApp Image 2026-06-07 at 13.14.54.jpeg",
    description: "Short Pow Jeans preto com cintura de elástico e cordão de ajuste. Tecido leve, bolsos laterais e logo bordado. Leve pra qualquer rolê.",
  },
  {
    category: "Shorts",
    name: "Short Pow Jeans Marinho",
    slug: "short-pow-jeans-marinho",
    priceCents: 9000,
    file: "Shorts R$ 90/WhatsApp Image 2026-06-07 at 13.14.55.jpeg",
    description: "Short Pow Jeans azul marinho com cintura de elástico e cordão de ajuste. Tecido leve, bolsos laterais e logo bordado. Conforto pro dia a dia.",
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
  const isPng = extname(item.file).toLowerCase() === ".png";
  const ext = isPng ? "png" : "jpg";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const path = `products/${item.slug}-${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: true });
  if (error) throw new Error(`Upload falhou (${item.file}): ${error.message}`);
  return publicUrl(path);
}

async function main() {
  await ensureBucket();

  let created = 0;
  for (const item of CATALOG) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (existing) {
      console.log(`  = já existe, pulando: ${item.slug}`);
      continue;
    }
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
        variants: { create: SIZES.map((s) => ({ size: s, stock: 8 })) },
      },
    });
    created++;
    console.log(`  + ${item.category} · ${item.name} (${SIZES.join("/")}) — ${url}`);
  }

  console.log(`\nPronto: ${created} produtos novos criados.`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
