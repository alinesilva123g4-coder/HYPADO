-- ============================================================================
-- HYPADO · Setup de Supabase Realtime para o painel admin
-- ============================================================================
-- Rode UMA VEZ no SQL Editor do Supabase:
--   Dashboard → SQL Editor → New query → cole tudo → Run
--
-- O que isto faz:
--   1. Adiciona as tabelas Order e Review à publication do Realtime, pra que
--      INSERT/UPDATE/DELETE sejam transmitidos pros clientes inscritos.
--   2. Habilita RLS e cria uma policy de SELECT só pro role `authenticated`.
--      Assim só o admin logado (via Supabase Auth) recebe os eventos —
--      visitantes anônimos com a anon key NÃO recebem dados de pedidos.
--
-- Observação: o app escreve via Prisma usando a connection string com
-- credenciais de owner do banco, que BYPASSA RLS. Logo, habilitar RLS aqui
-- não quebra nenhuma escrita/leitura do app — só afeta quem acessa via
-- Supabase client (anon/authenticated), que é exatamente o caso do Realtime.
-- ============================================================================

-- 1. Publication do Realtime ------------------------------------------------
-- Idempotente: só adiciona se a tabela ainda não estiver na publication.
-- (Postgres não tem "ADD TABLE IF NOT EXISTS" pra publication.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Order'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Review'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Review";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Product'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Product";
  END IF;
END $$;

-- 2. RLS + policy de leitura pro admin autenticado --------------------------
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_orders" ON "Order";
CREATE POLICY "admin_select_orders"
  ON "Order" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_select_reviews" ON "Review";
CREATE POLICY "admin_select_reviews"
  ON "Review" FOR SELECT
  TO authenticated
  USING (true);

-- Product já é lido publicamente pela loja (via Prisma, que bypassa RLS).
-- A policy abaixo só libera leitura pro Realtime do admin autenticado.
DROP POLICY IF EXISTS "admin_select_products" ON "Product";
CREATE POLICY "admin_select_products"
  ON "Product" FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Pronto. O componente RealtimeRefresh (admin/pedidos e admin/avaliacoes)
-- vai começar a atualizar a tela automaticamente quando entrar pedido/review.
-- ============================================================================
