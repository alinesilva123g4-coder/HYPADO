import crypto from "node:crypto";

/**
 * Meta Conversions API (server-side).
 *
 * Espelha os eventos do pixel pelo servidor — sobrevive a adblock/iOS e melhora
 * a qualidade de correspondência (match quality) dos anúncios. A deduplicação
 * com o pixel do navegador é feita pelo `event_id` (mesmo id nos dois lados).
 *
 * Só roda no servidor: o token (META_CAPI_TOKEN) é secreto e nunca vai pro
 * cliente. Falha sempre em silêncio — tracking nunca derruba a request.
 */

const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_TEST_EVENT_CODE || undefined;
const API_VERSION = "v21.0";

export const CAPI_ENABLED = Boolean(PIXEL_ID && TOKEN);

/** SHA-256 do valor normalizado (lowercase + trim), como a Meta exige. */
function hash(value?: string | null): string | undefined {
  if (!value) return undefined;
  const norm = value.trim().toLowerCase();
  if (!norm) return undefined;
  return crypto.createHash("sha256").update(norm).digest("hex");
}

/** Telefone: só dígitos (com DDI), depois SHA-256. */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

export type CapiUserData = {
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  /** Email em texto puro — é hasheado aqui antes de sair. */
  email?: string | null;
  /** Telefone em texto puro — é hasheado aqui antes de sair. */
  phone?: string | null;
};

export type CapiEvent = {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  /** Em segundos (epoch). Default: agora. */
  eventTime?: number;
  user: CapiUserData;
  customData?: Record<string, unknown>;
};

/**
 * Envia um evento pra Conversions API. Retorna true se a Meta aceitou.
 * Nunca lança — em qualquer erro, loga e retorna false.
 */
export async function sendCapiEvent(ev: CapiEvent): Promise<boolean> {
  if (!CAPI_ENABLED) return false;

  const user_data: Record<string, unknown> = {};
  if (ev.user.ip && ev.user.ip !== "unknown") user_data.client_ip_address = ev.user.ip;
  if (ev.user.userAgent) user_data.client_user_agent = ev.user.userAgent;
  if (ev.user.fbp) user_data.fbp = ev.user.fbp;
  if (ev.user.fbc) user_data.fbc = ev.user.fbc;
  const em = hash(ev.user.email);
  if (em) user_data.em = [em];
  const ph = hashPhone(ev.user.phone);
  if (ph) user_data.ph = [ph];

  const data: Record<string, unknown> = {
    event_name: ev.eventName,
    event_time: ev.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data,
  };
  if (ev.eventId) data.event_id = ev.eventId;
  if (ev.eventSourceUrl) data.event_source_url = ev.eventSourceUrl;
  if (ev.customData && Object.keys(ev.customData).length > 0) {
    data.custom_data = ev.customData;
  }

  const body: Record<string, unknown> = { data: [data] };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // Não queremos esperar muito; tracking é best-effort.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[meta-capi] ${ev.eventName} → ${res.status}: ${txt.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[meta-capi] ${ev.eventName} falhou`, e);
    return false;
  }
}
