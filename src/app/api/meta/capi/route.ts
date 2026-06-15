import { NextResponse } from "next/server";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { sendCapiEvent, CAPI_ENABLED } from "@/lib/meta-capi";

export const runtime = "nodejs";

/**
 * Recebe eventos do cliente (espelho do pixel) e dispara na Conversions API.
 * O cliente manda o mesmo `eventId` que usou no fbq → a Meta deduplica.
 * Dados sensíveis (IP, user-agent, cookies _fbp/_fbc) são lidos AQUI, no
 * servidor — o cliente só manda nome do evento, id e custom_data.
 */

const ALLOWED = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Contact",
  "Lead",
  "Search",
]);

function readCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function POST(req: Request) {
  // Sem credenciais configuradas, vira no-op silencioso (não quebra o cliente).
  if (!CAPI_ENABLED) return NextResponse.json({ ok: true, skipped: true });

  const ip = getClientIp(req);
  const rl = rateLimit({ key: `capi:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "bad_body" }, { status: 400 });
    }

    const { eventName, eventId, eventSourceUrl, customData, email, phone } =
      body as {
        eventName?: string;
        eventId?: string;
        eventSourceUrl?: string;
        customData?: Record<string, unknown>;
        email?: string;
        phone?: string;
      };

    if (!eventName || !ALLOWED.has(eventName)) {
      return NextResponse.json({ error: "bad_event" }, { status: 400 });
    }

    await sendCapiEvent({
      eventName,
      eventId: typeof eventId === "string" ? eventId.slice(0, 100) : undefined,
      eventSourceUrl:
        typeof eventSourceUrl === "string" ? eventSourceUrl.slice(0, 500) : undefined,
      customData:
        customData && typeof customData === "object" ? customData : undefined,
      user: {
        ip,
        userAgent: req.headers.get("user-agent"),
        fbp: readCookie(req, "_fbp"),
        fbc: readCookie(req, "_fbc"),
        email: typeof email === "string" ? email : undefined,
        phone: typeof phone === "string" ? phone : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[meta-capi route]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
