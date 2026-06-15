"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Img = { id: string; url: string };

export function SwipeGallery({
  images,
  alt,
  active,
  onChange,
}: {
  images: Img[];
  alt: string;
  active: number;
  onChange: (idx: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const widthRef = useRef(0);
  const moved = useRef(0); // distância arrastada — separa clique de swipe
  const isPointerDown = useRef(false);
  const lastX = useRef(0); // posição no último frame — base da velocidade
  const lastT = useRef(0); // timestamp do último frame
  const velocity = useRef(0); // px/ms do arraste (sinal = direção)
  const selfIdx = useRef(active); // último índice que ESTE componente emitiu
  const suppress = useRef(false); // ignora onScroll durante scroll programático
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null); // arraste em sync com o frame
  const animRaf = useRef<number | null>(null); // tween de snap/navegação

  const count = images.length;
  const clamp = useCallback(
    (idx: number) => Math.max(0, Math.min(count - 1, idx)),
    [count]
  );

  // Rola a pista até um índice. smooth = tween próprio com easing (consistente
  // e fluido, sem depender do "smooth" do navegador). O gesto do usuário nunca
  // passa por aqui, então não há briga com o momentum nativo.
  const scrollToIndex = useCallback((idx: number, smooth: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    suppress.current = true;
    if (suppressTimer.current) clearTimeout(suppressTimer.current);
    if (animRaf.current != null) cancelAnimationFrame(animRaf.current);

    const target = idx * el.clientWidth;
    if (!smooth) {
      el.scrollLeft = target;
      suppressTimer.current = setTimeout(() => (suppress.current = false), 60);
      return;
    }

    const from = el.scrollLeft;
    const dist = target - from;
    // Duração proporcional à distância (clamp 240–480ms) — perto é rápido,
    // longe ganha um pouco mais de respiro, sempre fluido.
    const dur = Math.max(240, Math.min(480, 200 + Math.abs(dist) * 0.4));
    const t0 = performance.now();
    const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      el.scrollLeft = from + dist * easeOutCubic(p);
      if (p < 1) {
        animRaf.current = requestAnimationFrame(step);
      } else {
        animRaf.current = null;
        suppress.current = false;
      }
    };
    animRaf.current = requestAnimationFrame(step);
  }, []);

  // Navegação interna (setas, teclado, thumbs, snap pós-arraste).
  const goTo = useCallback(
    (idx: number, smooth = true) => {
      const c = clamp(idx);
      selfIdx.current = c;
      onChange(c);
      scrollToIndex(c, smooth);
    },
    [clamp, onChange, scrollToIndex]
  );

  // Sincroniza só quando active muda POR FORA (não pelo nosso próprio onChange).
  useEffect(() => {
    if (active === selfIdx.current) return;
    selfIdx.current = active;
    scrollToIndex(active, true);
  }, [active, scrollToIndex]);

  // Detecta página ativa pelo scroll do usuário (toque/trackpad/wheel).
  // Não reposiciona a pista — só atualiza dots/contador. Sem eco.
  function onScroll() {
    const el = trackRef.current;
    if (!el || dragging || suppress.current) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== active && idx >= 0 && idx < count) {
      selfIdx.current = idx; // veio do scroll do usuário → não re-rolar
      onChange(idx);
    }
  }

  // ---- Arraste com mouse via Pointer Events (toque usa scroll nativo) ----
  function onPointerDown(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    isPointerDown.current = true;
    moved.current = 0;
    velocity.current = 0;
    setDragging(true);
    startX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    widthRef.current = el.clientWidth;
    lastX.current = e.clientX;
    lastT.current = performance.now();
    el.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || !isPointerDown.current) return;
    const x = e.clientX;
    const dx = x - startX.current;
    moved.current = Math.max(moved.current, Math.abs(dx));
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) {
      const v = (x - lastX.current) / dt;
      velocity.current = velocity.current * 0.6 + v * 0.4; // suaviza ruído
    }
    lastX.current = x;
    lastT.current = now;
    // Aplica o scroll dentro do rAF → 1 atualização por frame, sem engasgo.
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        el.scrollLeft = startScroll.current - (lastX.current - startX.current);
      });
    }
  }
  function endPointer(e?: React.PointerEvent) {
    const el = trackRef.current;
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setDragging(false);
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (el && e) el.releasePointerCapture?.(e.pointerId);
    if (!el) return;
    const w = widthRef.current || el.clientWidth || 1;
    const raw = el.scrollLeft / w;
    // Flick: velocidade alta avança/recua um slide na direção do gesto.
    const FLICK = 0.3; // px/ms
    let target = Math.round(raw);
    if (velocity.current < -FLICK) target = Math.ceil(raw);
    else if (velocity.current > FLICK) target = Math.floor(raw);
    goTo(target);
  }

  // Limpa timers/raf pendentes ao desmontar
  useEffect(
    () => () => {
      if (suppressTimer.current) clearTimeout(suppressTimer.current);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      if (animRaf.current != null) cancelAnimationFrame(animRaf.current);
    },
    []
  );

  // Clique sem arraste = abre o zoom em tela cheia
  function onImageClick() {
    if (moved.current < 6) setLightbox(true);
  }

  // Navegação por teclado no bloco da galeria
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setLightbox(true);
    }
  }

  return (
    <div className="flex flex-col gap-2 md:gap-4 md:sticky md:top-6 md:self-start">
      <div
        className="group relative"
        tabIndex={0}
        role="region"
        aria-roledescription="carrossel"
        aria-label={`Imagens de ${alt}`}
        onKeyDown={onKeyDown}
      >
        <div
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          className={`flex overflow-x-auto snap-x snap-mandatory rounded-md bg-surface select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            overscrollBehaviorX: "contain",
            // pan-x: deixa o dedo deslizar a pista na horizontal (scroll nativo);
            // pan-y: mantém o scroll vertical da página passando por cima. Sem
            // os dois, o swipe horizontal no toque era descartado pelo browser.
            touchAction: "pan-x pan-y",
            // scroll sempre instantâneo no nível nativo; o "suave" vem do nosso
            // tween (scrollToIndex), então o arraste/swipe não fica borrachudo.
            scrollBehavior: "auto",
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              onClick={onImageClick}
              className="relative flex-shrink-0 w-full snap-center aspect-[4/5] overflow-hidden"
            >
              <Image
                src={img.url}
                alt={i === 0 ? alt : ""}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover pointer-events-none select-none"
                draggable={false}
              />
            </div>
          ))}

          {/* Lupa (desktop) — sinaliza que dá pra ampliar */}
          <span className="hidden md:flex pointer-events-none absolute top-3 left-3 h-9 w-9 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2M11 8v6M8 11h6" />
            </svg>
          </span>
        </div>

        {/* Dots (mobile) */}
        {count > 1 && (
          <div className="md:hidden absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-5 bg-foreground" : "w-1.5 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter chip (mobile) */}
        {count > 1 && (
          <div className="md:hidden absolute top-3 right-3 px-2 py-1 rounded-full bg-foreground/70 backdrop-blur-sm text-background text-[10px] tabular-nums font-medium tracking-wider">
            {active + 1} / {count}
          </div>
        )}
      </div>

      {/* Thumbs (desktop) */}
      {count > 1 && (
        <div className="hidden md:grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => goTo(idx)}
              aria-label={`Ver imagem ${idx + 1}`}
              className={`relative aspect-square overflow-hidden bg-surface rounded-md transition-all ${
                idx === active ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={images}
          alt={alt}
          active={active}
          onChange={(idx) => goTo(idx, false)}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  alt,
  active,
  onChange,
  onClose,
}: {
  images: Img[];
  alt: string;
  active: number;
  onChange: (idx: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Bloqueia scroll do body e habilita teclado enquanto aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onChange(Math.min(count - 1, active + 1));
      else if (e.key === "ArrowLeft") onChange(Math.max(0, active - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, count, onChange, onClose]);

  // Reseta o zoom ao trocar de imagem
  useEffect(() => setZoom(false), [active]);

  function onMove(e: React.MouseEvent) {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Galeria ampliada de ${alt}`}
    >
      {/* Fechar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Contador */}
      {count > 1 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 text-xs tabular-nums tracking-wider">
          {active + 1} / {count}
        </div>
      )}

      {/* Imagem */}
      <div
        className="relative w-full h-full max-w-5xl max-h-[85vh] m-auto"
        onClick={(e) => {
          e.stopPropagation();
          setZoom((z) => !z);
        }}
        onMouseMove={onMove}
        style={{ cursor: zoom ? "zoom-out" : "zoom-in" }}
      >
        <Image
          src={images[active].url}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain transition-transform duration-200 ease-out select-none"
          draggable={false}
          style={{
            transform: zoom ? "scale(2.2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        />
      </div>

      {/* Setas */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(Math.max(0, active - 1));
            }}
            disabled={active === 0}
            aria-label="Imagem anterior"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(Math.min(count - 1, active + 1));
            }}
            disabled={active === count - 1}
            aria-label="Próxima imagem"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Thumbs */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(i);
              }}
              aria-label={`Ver imagem ${i + 1}`}
              className={`relative h-12 w-12 overflow-hidden rounded transition-all ${
                i === active ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
