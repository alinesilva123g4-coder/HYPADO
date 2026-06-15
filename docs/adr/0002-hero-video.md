# ADR 0002 — Hero da home em vídeo (autoplay) no lugar de imagem

- **Status:** Accepted (otimização concluída em 2026-06-07)
- **Data:** 2026-06-07
- **Autor:** cto-architect (C-Level Squad)

## Contexto

O topo (hero) da home usava uma imagem estática lifestyle via `next/image`. O
lojista pediu pra trocar por um vídeo. Vídeo no hero aumenta impacto/conversão
mas pesa no LCP e no consumo de dados — crítico porque o público é nordeste,
majoritariamente mobile/4G.

## Decisão

Trocar o `<Image>` do hero por um `<video autoPlay loop muted playsInline>`
servido de `/public/hero.mp4`, mantendo a imagem antiga como `poster` (primeiro
frame instantâneo + fallback se o vídeo falhar). `muted` + `playsInline` são
obrigatórios pra autoplay funcionar em iOS/Android.

## Alternativas consideradas

- **Manter imagem:** mais leve, mas o lojista pediu vídeo explicitamente.
- **Vídeo hospedado (Mux/Cloudflare Stream/YouTube):** streaming adaptativo,
  ideal pra performance, mas adiciona vendor + custo. Rejeitado nesta fase
  (1 lojista, pré-primeira-venda).

## Consequências

- **Positivo:** hero com movimento, poster garante paint imediato.
- **Negativo (resolvido):** o arquivo original tinha **~26 MB**. Em 2026-06-07
  instalamos ffmpeg (winget `Gyan.FFmpeg`) e recodificamos pra **3,13 MB**
  (1080×1720, H.264 CRF 28, sem áudio, `+faststart`):
  `ffmpeg -i hero.mp4 -c:v libx264 -crf 28 -preset slow -an -pix_fmt yuv420p -movflags +faststart hero-opt.mp4`.
  O original ficou guardado em `web/hero-source-original.mp4` (fora de
  `public/`, não servido) caso precise recomprimir com outra qualidade.

## Trade-offs

Ganhamos apelo visual. Abrimos mão (temporariamente) de performance no mobile —
rastreado como pendência acima.
