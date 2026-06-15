import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Verifica se o request atual tem um usuário Supabase autenticado.
 *
 * Modelo atual: qualquer usuário autenticado no Supabase é admin
 * (justificado porque só o fundador tem conta cadastrada hoje).
 *
 * Quando precisar de roles, troque a checagem por algo como:
 *   const role = user?.app_metadata?.role;
 *   return role === "admin";
 */
export async function isAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return false;
    return true;
  } catch {
    return false;
  }
}

/** Retorna o usuário autenticado (ou null). Use em páginas/admin pra exibir e-mail. */
export async function getAdminUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}
