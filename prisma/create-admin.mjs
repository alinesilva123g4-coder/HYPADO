// ============================================================================
// HYPADO · Cria (ou atualiza a senha de) um usuário admin no Supabase Auth
// ============================================================================
// O login do painel (/admin/login) usa Supabase Auth. Qualquer usuário
// autenticado é admin (ver src/lib/admin-auth.ts). Este script cria esse
// usuário com e-mail já confirmado, pronto pra logar.
//
// Como rodar (Node 24 carrega o .env nativamente):
//   cd web
//   node --env-file=.env prisma/create-admin.mjs voce@hypado.com.br SUA_SENHA_FORTE
//
// Se o e-mail já existir, apenas atualiza a senha.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const [, , email, password] = process.argv;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltam envs: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
if (!email || !password) {
  console.error(
    "Uso: node --env-file=.env prisma/create-admin.mjs <email> <senha>",
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // Tenta criar com e-mail já confirmado.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!error) {
    console.log(`✓ Admin criado: ${email} (id ${data.user.id})`);
    console.log("  Já pode logar em /admin/login.");
    return;
  }

  // Já existe? Procura e atualiza a senha.
  const alreadyExists =
    /already|registered|exists/i.test(error.message) || error.status === 422;
  if (!alreadyExists) {
    throw error;
  }

  console.log("Usuário já existe — atualizando a senha…");
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) throw new Error("Usuário existe mas não foi encontrado na listagem.");

  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updErr) throw updErr;

  console.log(`✓ Senha atualizada para ${email}. Já pode logar em /admin/login.`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
