import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function url() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

let _publicClient: SupabaseClient | null = null;

/** Client público — usado no browser (RLS aplicada). Lazy: instancia no 1º uso. */
export function getSupabase(): SupabaseClient {
  if (_publicClient) return _publicClient;
  const u = url();
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!u || !k) throw new Error("Supabase envs ausentes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  _publicClient = createClient(u, k, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _publicClient;
}

/** Client server-side com service role — bypassa RLS.
 *  Use apenas em rotas de API/server actions, NUNCA exponha pro browser. */
export function supabaseAdmin() {
  const u = url();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!u) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return createClient(u, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Helper pra montar URL pública de um objeto do Storage. */
export function storageUrl(bucket: string, path: string) {
  return `${url()}/storage/v1/object/public/${bucket}/${path}`;
}
