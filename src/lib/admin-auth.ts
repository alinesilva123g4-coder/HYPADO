import { cookies } from "next/headers";
import { createHash } from "node:crypto";

export const ADMIN_COOKIE = "hypado_admin";

function tokenFor(pw: string) {
  return createHash("sha256").update(`hypado::${pw}`).digest("hex");
}

export function expectedToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return tokenFor(pw);
}

export function makeToken(pw: string) {
  return tokenFor(pw);
}

export async function isAdmin() {
  const exp = expectedToken();
  if (!exp) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === exp;
}
