import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { isAdmin } from "@/lib/admin-auth";

const MAX_IMAGE_PUBLIC = 5 * 1024 * 1024; // 5MB (reviews públicas)
const MAX_IMAGE_ADMIN = 12 * 1024 * 1024; // 12MB (admin)
const MAX_VIDEO = 50 * 1024 * 1024; // 50MB (admin only)

const IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VID = ["video/mp4", "video/webm", "video/quicktime"];

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

    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
    const path = join(dir, name);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path, buf);

    return NextResponse.json({
      url: `/uploads/${name}`,
      type: isImage ? "image" : "video",
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}