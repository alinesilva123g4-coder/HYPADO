import { prisma } from "@/lib/db";

export type SiteSettings = {
  announceMessages: string[];
  whatsappNumber: string;
  instagram: string;
  freeShippingFromCents: number;
  flatShippingCents: number;
  heroHeadline: string;
  heroSubline: string;
  shopOpen: boolean;
};

const DEFAULTS: SiteSettings = {
  announceMessages: [
    "Drop limitado · sem reposição",
    "Frete grátis acima de R$ 299",
    "Feito no Nordeste · enviado pra todo o Brasil",
    "Pagamento em até 3x sem juros",
  ],
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "558881623640",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "hypado_of",
  freeShippingFromCents: 29900,
  flatShippingCents: 2490,
  heroHeadline: "",
  heroSubline: "",
  shopOpen: true,
};

const KEY = "site";

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULTS;
    const parsed = JSON.parse(row.value);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSiteSettings(patch: Partial<SiteSettings>) {
  const current = await getSiteSettings();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
