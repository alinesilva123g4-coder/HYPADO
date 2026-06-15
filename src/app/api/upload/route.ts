import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, storageUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_PUBLIC = 5 * 1024 * 1024; // 5MB (reviews públicas)
const MAX_IMAGE_ADMIN = 12 * 1024 * 1024; // 12MB (admin)
const MAX_VIDEO = 50 * 1024 * 1024; // 50MB (admin only)

const IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VID = ["video/mp4", "video/webm", "video/quicktime"];

const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "hypado-uploads";

export async function POST(req: Request) {
  const admin = await isAdmin();
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

    const isImage = IMG.includes(file.type);
    const isVideo = VID.includes(file.type);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    if (isVideo && !admin) {
      return NextResponse.json({ error: "video_admin_only" }, { status: 403 });
    }

    const max = isImage ? (admin ? MAX_IMAGE_ADMIN : MAX_IMAGE_PUBLIC) : MAX_VIDEO;
    if (file.size > max) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }

    const ext = (() => {
      switch (file.type) {
        case "image/jpeg": return "jpg";
        case "image/png": return "png";
        case "image/webp": return "webp";
        case "image/gif": return "gif";
        case "video/mp4": return "mp4";
        case "video/webm": return "webm";
        case "video/quicktime": return "mov";
        default: return "bin";
      }
    })();

    const folder = isImage ? (admin ? "products" : "reviews") : "videos";
    const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
    const path = `${folder}/${name}`;

    const buf = Buffer.from(await file.arrayBuffer());

    let sb;
    try {
      sb = supabaseAdmin();
    } catch (e) {
      // env do service role ausente (ex.: faltou setar no Vercel)
      console.error("supabaseAdmin config error", e);
      return NextResponse.json({ error: "storage_misconfigured" }, { status: 500 });
    }

    async function tryUpload() {
      return sb!.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: file!.type, upsert: false });
    }

    let { error } = await tryUpload();

    // Bucket ainda não existe nesse ambiente — cria (público) e tenta de novo.
    // Deixa o upload do admin funcionar "do zero" sem depender de script externo.
    if (error && /bucket.*not.*found|not.*found|does not exist/i.test(error.message || "")) {
      const { error: createErr } = await sb.storage.createBucket(BUCKET, { public: true });
      if (createErr && !/already exists/i.test(createErr.message || "")) {
        console.error("supabase createBucket error", createErr);
        return NextResponse.json({ error: "bucket_create_failed" }, { status: 500 });
      }
      ({ error } = await tryUpload());
    }

    if (error) {
      console.error("supabase upload error", error);
      return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({
      url: storageUrl(BUCKET, path),
      type: isImage ? "image" : "video",
    });
  } catch (e) {
    console.error("upload route error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
