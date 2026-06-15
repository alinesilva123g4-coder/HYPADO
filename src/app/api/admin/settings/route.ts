import { NextResponse } from "next/server";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings";
import { invalidateHeitorCache } from "@/lib/chat-context";

export async function GET() {
  return NextResponse.json(await getSiteSettings());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const next = await saveSiteSettings(body);
  invalidateHeitorCache();
  return NextResponse.json(next);
}
