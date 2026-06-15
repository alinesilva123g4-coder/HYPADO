"use client";

import { useEffect, useState } from "react";

/**
 * Hero do topo. Renderiza a imagem (poster) no SSR e em aparelhos fracos —
 * só "evolui" para o vídeo autoplay em dispositivos capazes, com boa rede e
 * sem preferência por menos movimento. Isso evita o download + decode contínuo
 * do vídeo (o maior custo de CPU/bateria) em celulares antigos.
 */
export function HeroMedia({
  video,
  poster,
  className,
}: {
  video: string;
  poster: string;
  className: string;
}) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lowPower = document.documentElement.classList.contains("lp");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!lowPower && !reduce) setPlay(true);
  }, []);

  if (!play) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="HYPADO · Drop 01" className={className} />;
  }

  return (
    <video
      src={video}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      aria-label="HYPADO · Drop 01"
      className={className}
    />
  );
}
