"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const startX = useRef(0);
  const startScroll = useRef(0);
  const widthRef = useRef(0);

  // Sincroniza scroll quando active muda via thumbnails
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    widthRef.current = w;
    el.scrollTo({ left: active * w, behavior: dragging ? "auto" : "smooth" });
  }, [active, dragging]);

  // Detecta página ativa pelo scroll (snap)
  function onScroll() {
    const el = trackRef.current;
    if (!el || dragging) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== active && idx >= 0 && idx < images.length) onChange(idx);
  }

  // Touch fallback pra navegadores que não respeitam scroll-snap perfeitamente
  function onTouchStart(e: React.TouchEvent) {
    const el = trackRef.current;
    if (!el) return;
    setDragging(true);
    startX.current = e.touches[0].clientX;
    startScroll.current = el.scrollLeft;
    widthRef.current = el.clientWidth;
  }
  function onTouchEnd() {
    const el = trackRef.current;
    setDragging(false);
    if (!el) return;
    const w = widthRef.current || el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    onChange(Math.max(0, Math.min(images.length - 1, idx)));
  }

  return (
    <div className="flex flex-col gap-2 md:gap-4 md:sticky md:top-6 md:self-start">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-md bg-surface [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ overscrollBehaviorX: "contain" }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
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
        </div>

        {/* Dots (mobile) */}
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-5 bg-foreground"
                    : "w-1.5 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter chip (mobile) */}
        {images.length > 1 && (
          <div className="md:hidden absolute top-3 right-3 px-2 py-1 rounded-full bg-foreground/70 backdrop-blur-sm text-background text-[10px] tabular-nums font-medium tracking-wider">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbs (desktop) */}
      {images.length > 1 && (
        <div className="hidden md:grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => onChange(idx)}
              className={`relative aspect-square overflow-hidden bg-surface rounded-md transition-all ${
                idx === active ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
