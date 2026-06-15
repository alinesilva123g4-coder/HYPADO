"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const DEFAULT_MESSAGES = [
  "Drop limitado · sem reposição",
  "Feito no Nordeste · enviado pra todo o Brasil",
  "Pagamento em até 3x sem juros",
];

function Separator() {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      aria-hidden
      width={48}
      height={48}
      draggable={false}
      className="mx-6 md:mx-10 h-4 md:h-5 w-auto select-none object-contain opacity-90 [filter:brightness(0)_invert(1)]"
    />
  );
}

export function AnnounceBar() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [grabbing, setGrabbing] = useState(false);
  const [copies, setCopies] = useState(2); // nº de cópias da sequência (preenche a tela)

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLSpanElement>(null);
  const offsetRef = useRef(0); // px já percorridos (sempre dentro de [0, half))
  const halfRef = useRef(0); // largura de UMA cópia das frases
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.announceMessages?.length) setMessages(s.announceMessages);
      })
      .catch(() => {});
  }, []);

  // Marquee dirigido por JS: gira sozinho e aceita arrasto do usuário.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = () => {
      // Largura de UMA sequência (não depende de quantas cópias existem).
      const seqW = seqRef.current?.scrollWidth || track.scrollWidth / copies || 1;
      halfRef.current = seqW;
      // Cópias suficientes para cobrir a tela inteira + margem de loop.
      const viewport = wrapRef.current?.clientWidth || window.innerWidth || seqW;
      const needed = Math.max(2, Math.ceil(viewport / seqW) + 1);
      setCopies((c) => (c === needed ? c : needed));
    };
    measure();

    // Velocidade equivalente ao ritmo anterior: uma cópia a cada ~18s.
    const speed = () => halfRef.current / 18; // px por segundo

    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const half = halfRef.current;
      if (!draggingRef.current && !reduce) {
        offsetRef.current = (offsetRef.current + speed() * dt) % half;
      }
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [messages, copies]);

  const wrap = (v: number) => {
    const w = halfRef.current || 1;
    return ((v % w) + w) % w;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    setGrabbing(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    // Arrastar para a direita revela o conteúdo anterior (offset diminui).
    offsetRef.current = wrap(offsetRef.current - dx);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setGrabbing(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const sequence = messages.map((m, i) => (
    <span key={i} className="flex items-center whitespace-nowrap">
      {m}
      <Separator />
    </span>
  ));

  return (
    <div ref={wrapRef} className="bg-foreground text-background overflow-hidden">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className={`h-7 md:h-8 flex items-center overflow-hidden text-[9px] md:text-[10px] uppercase tracking-[0.25em] md:tracking-[0.3em] select-none touch-pan-y ${
          grabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Faixa dirigida por JS: cópias idênticas para o loop sem emenda. */}
        <div ref={trackRef} className="flex w-max items-center will-change-transform">
          {Array.from({ length: copies }).map((_, i) => (
            <span
              key={i}
              ref={i === 0 ? seqRef : undefined}
              aria-hidden={i > 0}
              className="flex items-center"
            >
              {sequence}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
