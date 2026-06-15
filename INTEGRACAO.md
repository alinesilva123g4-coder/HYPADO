# 🚀 Guia de Integração — HYPADO Ecommerce

Passo a passo para colocar a loja no ar para um cliente. Siga na ordem.
Tempo estimado: ~30–45 min na primeira vez.

---

## 0. Pré-requisitos

- Conta na **Netlify** (hospedagem)
- Conta no **Supabase** (banco de dados + login do admin + fotos)
- Node 20+ instalado localmente (só para testar antes de subir)
- (Opcional) conta na **Groq** para o chatbot "Heitor"
- (Opcional) **Meta Pixel** para anúncios no Instagram/Facebook

---

## 1. Criar o projeto no Supabase

1. https://supabase.com → **New project**. Anote a **senha do banco**.
2. Em **Project Settings → Database → Connection string**, copie:
   - **Transaction pooler** (porta `6543`) → vira o `DATABASE_URL`
   - **Direct connection** (porta `5432`) → vira o `DIRECT_URL`
3. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ No `DATABASE_URL`, mantenha `?pgbouncer=true&connection_limit=10&pool_timeout=20`.
> O painel admin dispara ~26 queries em paralelo; com `connection_limit=1` dá erro **P2024**.

---

## 2. Criar o bucket de fotos (Storage)

1. Supabase → **Storage → New bucket**
2. Nome: `hypado-uploads` (igual ao `SUPABASE_UPLOAD_BUCKET`)
3. Marque **Public bucket** (as fotos dos produtos são públicas)

---

## 3. Configurar as variáveis de ambiente

Copie o exemplo e preencha:

```bash
cd web
cp .env.example .env
```

Preencha **todas** as chaves do passo 1, 2 e os contatos:

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | domínio final, ex. `https://lojadocliente.com.br` |
| `NEXT_PUBLIC_BRAND` | nome da marca |
| `DATABASE_URL` / `DIRECT_URL` | conexões do passo 1 |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | passo 1 |
| `SUPABASE_UPLOAD_BUCKET` | `hypado-uploads` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` / `WHATSAPP_NUMBER` | número com DDI, ex. `5581999999999` |
| `NEXT_PUBLIC_INSTAGRAM` | @ do Instagram (sem o @) |
| `LLM_API_KEY` | (opcional) chave Groq do chatbot |
| `NEXT_PUBLIC_META_PIXEL_ID` / `META_*` | (opcional) anúncios — ver passo 9 |

---

## 4. Criar as tabelas no banco (migrations)

```bash
cd web
npm install
npx prisma migrate deploy
```

Isso cria todas as tabelas (produtos, pedidos, avaliações, etc.).

---

## 5. Ligar o tempo real do painel

No Supabase → **SQL Editor → New query**, cole **todo** o conteúdo de
`prisma/realtime-setup.sql` e clique **Run**. (Roda uma vez só.)

Isso faz o painel atualizar sozinho quando entra pedido/avaliação e quando você
ativa/desativa um produto — sem precisar dar F5.

---

## 6. Criar o usuário admin (login do cliente)

O login do painel usa o **Supabase Auth** (e-mail + senha).

1. Supabase → **Authentication → Users → Add user**
2. Preencha o e-mail e a senha do cliente. Marque **Auto Confirm User**.
3. Pronto: esse e-mail/senha entra em `https://SEUDOMINIO/admin/login`.

> Qualquer usuário autenticado é admin (só o cliente terá conta). Para vários
> níveis de acesso no futuro, veja o comentário em `src/lib/admin-auth.ts`.

---

## 7. Testar localmente (recomendado antes de subir)

```bash
cd web
npm run dev
```

- Loja: http://localhost:3000
- Painel: http://localhost:3000/admin/login

Cadastre 1 produto com foto e tamanhos, faça um pedido de teste pelo WhatsApp e
confira se aparece em **Pedidos**.

---

## 8. Deploy na Netlify

1. Suba o repositório para o GitHub.
2. Netlify → **Add new site → Import from Git** → selecione o repo.
3. **Base directory:** `web`  ·  **Build command:** `npm run build`  ·  **Publish:** `.next`
   (já vem do `netlify.toml`; o plugin do Next é detectado sozinho).
4. **Site settings → Environment variables:** cole **todas** as variáveis do `.env`.
5. **Deploy**.
6. **Domain settings:** aponte o domínio do cliente e atualize `NEXT_PUBLIC_SITE_URL`.

> Na Netlify o `prisma generate` roda sem problema (ambiente limpo). O erro
> `EPERM` que aparece localmente é só o servidor de dev travando o arquivo no Windows.

---

## 9. (Opcional) Integrações de marketing

- **Chatbot Heitor:** crie uma chave na https://console.groq.com e preencha `LLM_API_KEY`.
- **Meta Pixel + Conversions API:** preencha `NEXT_PUBLIC_META_PIXEL_ID`,
  `META_PIXEL_ID` e `META_CAPI_TOKEN` (token em Gerenciador de Eventos → Pixel →
  Configurações). Deixe `META_TEST_EVENT_CODE` vazio em produção.
- **Google Analytics:** preencha `NEXT_PUBLIC_GA_ID` (`G-XXXX`).

Todas são opcionais — a loja funciona 100% sem elas.

---

## 10. Checklist pós-deploy ✅

- [ ] Loja abre no domínio final
- [ ] `/admin/login` aceita o e-mail/senha do cliente
- [ ] Dashboard carrega sem o aviso de erro de banco
- [ ] Cadastrar produto + foto funciona (testa o Storage)
- [ ] Botão "Comprar pelo WhatsApp" abre o número certo
- [ ] Um pedido de teste aparece em **Pedidos** automaticamente (tempo real)
- [ ] Ativar/desativar produto na lista reflete na loja
- [ ] **Configurações:** WhatsApp, Instagram e mensagens do topo conferem

---

## 11. Como o cliente usa o painel (resumo para repassar)

- **Dashboard:** visão do dia, pendências e vendas, em linguagem simples.
- **Produtos:** criar/editar, ligar o interruptor **na loja/oculto**, ajustar
  estoque por tamanho com os botões **+/−** (tudo pelo celular).
- **Pedidos:** acompanhar status (pendente → pago → enviado → entregue) e falar
  com o cliente direto no WhatsApp.
- **Avaliações:** responder, verificar e moderar.
- **Analytics:** quem visitou, o que viu e taxa de conversão.
- **Configurações:** abrir/fechar a loja, contatos e textos da home.

---

Dúvidas técnicas: o código do painel está em `src/app/admin/` e as APIs em
`src/app/api/admin/`.
