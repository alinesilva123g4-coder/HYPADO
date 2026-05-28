"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NavItem = { label: string; href: string; image: string; tagline: string };

const LINKS: NavItem[] = [
  {
    label: "Blusas",
    href: "/categoria/Blusas",
    image: "/products/Blusas/01/SaveClip.App_641328365_17995342235878696_4773564334849960735_n.jpg",
    tagline: "Modelagem oversized, algodão pesado.",
  },
  {
    label: "Camisetas",
    href: "/categoria/Camisetas",
    image: "/products/Camisetas/01/SaveClip.App_622077576_17865846720563810_8673686830803046630_n.jpg",
    tagline: "Algodão peruano, caimento premium.",
  },
  {
    label: "Shorts",
    href: "/categoria/Shorts",
    image: "/products/Shorts/01/SaveClip.App_612151975_17990784590878696_1370037901826838819_n.jpg",
    tagline: "Tactel premium, leve pra qualquer rolê.",
  },
  {
    label: "Kits",
    href: "/categoria/Kits",
    image: "/products/Kits/01/SaveClip.App_628742158_17993967518878696_5945230762778161861_n.jpg",
    tagline: "Looks completos, streetwear em conjunto.",
  },
  {
    label: "Chinelas",
    href: "/categoria/Chinelas",
    image: "/products/Chinelas/01/SaveClip.App_619912105_17991991928878696_7624821036760989017_n.jpg",
    tagline: "Conforto absurdo, identidade nordestina.",
  },
];

const META = [
  { label: "Sobre a marca", href: "/sobre" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "Atendimento", href: "/contato" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeIdx = hovered ?? 0;
  const activeImage = LINKS[activeIdx]?.image;

  return (
    <>
      {/* Trigger — 3 linhas assimétricas que se transformam em X */}
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative h-11 w-11 -ml-1 flex items-center justify-center z-[60] group rounded-full border border-line bg-background hover:border-foreground hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)] active:scale-95 transition-all duration-300"
      >
        <span className="relative block h-[14px] w-[20px]" aria-hidden>
          {/* Linha 1 — vira diagonal \ */}
          <span
            className={`absolute left-0 top-0 h-[2px] bg-foreground rounded-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open
                ? "w-[20px] translate-y-[6px] rotate-45"
                : "w-[20px] group-hover:w-[16px]"
            }`}
          />
          {/* Linha 2 — meio, encolhe e some */}
          <span
            className={`absolute left-0 top-[6px] h-[2px] bg-foreground rounded-full transition-all duration-300 ${
              open
                ? "w-0 opacity-0 -translate-x-2"
                : "w-[14px] opacity-100 group-hover:w-[20px]"
            }`}
          />
          {/* Linha 3 — vira diagonal / */}
          <span
            className={`absolute left-0 top-[12px] h-[2px] bg-foreground rounded-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open
                ? "w-[20px] -translate-y-[6px] -rotate-45"
                : "w-[10px] group-hover:w-[20px]"
            }`}
          />
        </span>
        {/* Bolinha indicadora */}
        <span
          aria-hidden
          className={`absolute -top-0.5 -right-0.5 h-[6px] w-[6px] rounded-full bg-foreground transition-all duration-300 ${
            open ? "opacity-0 scale-0" : "opacity-100 scale-100 group-hover:scale-125"
          }`}
        />
      </button>

      {/* Overlay — portaled to body para escapar do containing block do header (backdrop-filter) */}
      {mounted &&
        createPortal(
          <div
            aria-hidden={!open}
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <aside
          className={`absolute inset-y-0 left-0 w-full sm:w-[460px] lg:w-[760px] bg-background border-r border-line shadow-[8px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Left column — nav */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <Link
                href="/"
                aria-label="HYPADO · início"
                onClick={() => setOpen(false)}
                className="inline-flex items-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/brand/logo.png"
                  alt="HYPADO"
                  width={160}
                  height={160}
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="relative h-10 w-10 -mr-2 flex items-center justify-center group"
              >
                <span className="absolute h-[2px] w-7 bg-foreground rotate-45 transition-colors group-hover:bg-foreground/70" />
                <span className="absolute h-[2px] w-7 bg-foreground -rotate-45 transition-colors group-hover:bg-foreground/70" />
              </button>
            </div>

            {/* Drop highlight */}
            <Link
              href="/"
              className="group block mx-6 mt-6 border border-line p-4 rounded-md hover:border-foreground transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted">
                    Drop atual
                  </div>
                  <div className="mt-1 text-sm font-medium">Coleção 01 · north east</div>
                </div>
                <span className="text-foreground/40 group-hover:translate-x-1 group-hover:text-foreground transition-all">
                  →
                </span>
              </div>
            </Link>

            <div className="px-6 pt-8 pb-2 text-[10px] uppercase tracking-[0.4em] text-muted">
              Coleção
            </div>

            <nav className="flex-1 overflow-y-auto px-6 pb-6">
              <ul className="flex flex-col">
                {LINKS.map((l, i) => (
                  <li
                    key={l.href}
                    className={`transform transition-all duration-500 ${
                      open
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                    style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                  >
                    <Link
                      href={l.href}
                      onMouseEnter={() => setHovered(i)}
                      onFocus={() => setHovered(i)}
                      className="group relative flex items-center justify-between border-b border-line py-5 transition-colors"
                    >
                      <div className="flex items-baseline gap-4 min-w-0">
                        <span className="text-[10px] tabular-nums text-muted tracking-widest">
                          0{i + 1}
                        </span>
                        <span className="gothic text-4xl text-foreground/90 group-hover:text-foreground transition-colors truncate">
                          {l.label}
                        </span>
                      </div>
                      <span
                        className="text-foreground/30 transition-all duration-300 group-hover:translate-x-2 group-hover:text-foreground"
                        aria-hidden
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-10 text-[10px] uppercase tracking-[0.4em] text-muted">
                Mais
              </div>
              <ul className="mt-3 space-y-3">
                {META.map((m, i) => (
                  <li
                    key={m.href}
                    className={`transform transition-all duration-500 ${
                      open
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    }`}
                    style={{
                      transitionDelay: open ? `${400 + i * 50}ms` : "0ms",
                    }}
                  >
                    <Link
                      href={m.href}
                      className="text-sm text-foreground/70 hover:text-foreground"
                    >
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-line px-6 py-6">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted">
                north east · Brasil
              </div>
              <p className="mt-2 text-sm text-foreground/70 max-w-xs leading-relaxed">
                Streetwear nordestino. Drop limitado, sem reposição.
              </p>
            </div>
          </div>

          {/* Right column — preview (desktop only) */}
          <div className="hidden lg:block relative w-[320px] flex-shrink-0 bg-surface border-l border-line overflow-hidden">
            {LINKS.map((l, i) => (
              <div
                key={l.href}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  i === activeIdx ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={i !== activeIdx}
              >
                <Image
                  src={l.image}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-background">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-background/70">
                    Categoria 0{i + 1}
                  </div>
                  <div className="mt-1 gothic text-3xl">{l.label}</div>
                  <p className="mt-2 text-xs leading-relaxed text-background/80 max-w-[240px]">
                    {l.tagline}
                  </p>
                </div>
              </div>
            ))}
            {/* Watermark when nothing hovered */}
            <div className="absolute top-6 left-6 text-[10px] uppercase tracking-[0.3em] text-background mix-blend-difference">
              HYPADO · preview
            </div>
          </div>
        </aside>
          </div>,
          document.body
        )}
    </>
  );
}
