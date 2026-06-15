// ============================================================================
// HYPADO · Migração de imagens legadas de /public/products → Supabase Storage
// ============================================================================
// As fotos seedadas dos produtos ficam em web/public/products/... e o banco
// guarda urls relativas tipo "/products/Camisetas/01/foto.jpg". Uploads NOVOS
// (admin) já vão direto pro bucket. Este script migra as legadas pra o mesmo
// bucket e reescreve ProductImage.url pra URL pública do Storage.
//
// Como rodar (Node 24 carrega o .env nativamente):
//   cd web
//   node --env-file=.env prisma/migrate-images-to-storage.mjs
//
// É idempotente: imagens cuja url já é http(s) são puladas. Pode rodar de novo
// sem duplicar.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "hypado-uploads";
const PUBLIC_DIR = join(process.cwd(), "public");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltam envs: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. " +
      "Rode com: node --env-file=.env prisma/migrate-images-to-storage.mjs",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const CONTENT_TYPE = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function ensureBucket() {
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) throw new Error(`Não consegui criar o bucket "${BUCKET}": ${error.message}`);
  console.log(`Bucket "${BUCKET}" criado (público).`);
}

async function main() {
  await ensureBucket();

  const images = await prisma.productImage.findMany({ orderBy: { position: "asc" } });
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const img of images) {
    if (/^https?:\/\//i.test(img.url)) {
      skipped++;
      continue;
    }

    const rel = img.url.replace(/^\/+/, ""); // "products/Camisetas/01/foto.jpg"
    const localPath = join(PUBLIC_DIR, rel);
    const ext = (rel.split(".").pop() || "").toLowerCase();
    const contentType = CONTENT_TYPE[ext] || "application/octet-stream";

    let buf;
    try {
      buf = await readFile(localPath);
    } catch {
      console.warn(`  ✗ arquivo não encontrado: ${localPath}`);
      failed++;
      continue;
    }

    const storagePath = rel; // mantém a mesma estrutura de pastas no bucket
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buf, { contentType, upsert: true });

    if (upErr) {
      console.warn(`  ✗ upload falhou (${rel}): ${upErr.message}`);
      failed++;
      continue;
    }

    await prisma.productImage.update({
      where: { id: img.id },
      data: { url: publicUrl(storagePath) },
    });
    migrated++;
    if (migrated % 10 === 0) console.log(`  … ${migrated} migradas`);
  }

  console.log(
    `\nConcluído: ${migrated} migradas, ${skipped} já no Storage, ${failed} falhas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
