import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `leads:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  try {
    const { name, phone, birthdate } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    const digits = String(phone).replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 }
      );
    }

    const bd = birthdate ? new Date(String(birthdate)) : null;
    const birthdateValid = bd && !Number.isNaN(bd.getTime()) ? bd : null;

    await prisma.lead.upsert({
      where: { phone: digits },
      create: {
        name: String(name).trim(),
        phone: digits,
        birthdate: birthdateValid,
        source: "newsletter_popup",
      },
      update: {
        name: String(name).trim(),
        birthdate: birthdateValid,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leads] failed", e);
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }
}
