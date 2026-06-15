# ADR 0001 — Nova categoria "Calças"

- **Status:** Accepted
- **Data:** 2026-06-07
- **Autor:** cto-architect (C-Level Squad)

## Contexto

A loja nasceu com 5 categorias fixas (Blusas, Camisetas, Shorts, Chinelas,
Kits), repetidas como constantes hardcoded em múltiplos arquivos. Chegaram 3
calças jeans skinny novas (R$ 145) que não encaixam em nenhuma categoria
existente. Não há tabela `Category` — categoria é um campo `string` em
`Product`, e a lista de categorias válidas vive duplicada no código.

## Decisão

Adicionar "Calças" como 6ª categoria, replicando a constante em **todos** os
pontos que listam categorias, em vez de criar uma tabela `Category`:

- `categoria/[name]/page.tsx` (VALID + TAGLINES)
- `categoria/page.tsx` (CATEGORIES + TAGLINES)
- `page.tsx` (tiles da home)
- `sitemap.ts`
- `admin/produtos/_components/ProductForm.tsx`
- `Header.tsx`, `Footer.tsx`, `MobileMenu.tsx`
- `produto/[slug]/ProductDetail.tsx` (CATEGORY_HIGHLIGHTS)
- `lib/chat-context.ts` (contexto do chatbot Heitor)

## Alternativas consideradas

- **Tabela `Category` no Prisma** (fonte única de verdade): correto a longo
  prazo, mas exige migração + refactor de ~9 arquivos + admin de categorias.
  Rejeitado agora — over-engineering pra uma loja de 1 lojista com ~6
  categorias estáveis. O simplest thing that works pelos próximos 18 meses é
  manter as constantes.

## Consequências

- **Positivo:** zero migração, mudança reversível, padrão idêntico ao existente.
- **Negativo (dívida técnica prudente/deliberada):** categoria continua
  duplicada em ~9 lugares. Adicionar a 7ª categoria repete o trabalho e tem
  risco de esquecer um arquivo (ex.: a categoria sumir de um menu).
- **Gatilho de paydown:** ao chegar a 3ª categoria nova OU ao precisar de
  atributos por categoria (imagem de capa, ordem, ativo/inativo), migrar pra
  tabela `Category`.

## Trade-offs

Ganhamos velocidade e simplicidade. Abrimos mão de fonte única de verdade —
aceitável e rastreado aqui.
