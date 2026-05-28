import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const s = await getSiteSettings();
  // expõe só campos seguros pro browser
  return NextResponse.json({
    announceMessages: s.announceMessages,
    whatsappNumber: s.whatsappNumber,
    instagram: s.instagram,
    freeShippingFromCents: s.freeShippingFromCents,
    flatShippingCents: s.flatShippingCents,
    shopOpen: s.shopOpen,
  });
}
