"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useChat } from "@/lib/chat";

type Tab = {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  match: (p: string) => boolean;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TABS: Tab[] = [
  {
    label: "Início",
    href: "/",
    match: (p) => p === "/",
    icon: () => (
      <svg viewBox="0 0 24 24" {...stroke} className="h-[22px] w-[22px]" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    ),
  },
  {
    label: "Coleção",
    href: "/categoria",
    match: (p) => p.startsWith("/categoria") || p.startsWith("/produto"),
    icon: () => (
      <svg viewBox="0 0 24 24" {...stroke} className="h-[22px] w-[22px]" aria-hidden>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
      </svg>
    ),
  },
  {
    label: "Lookbook",
    href: "/lookbook",
    match: (p) => p.startsWith("/lookbook"),
    icon: () => (
      <svg viewBox="0 0 24 24" {...stroke} className="h-[22px] w-[22px]" aria-hidden>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M3.5 16l4.5-4.5 4 4 3-3 5.5 5.5" />
        <circle cx="8.5" cy="9" r="1.4" />
      </svg>
    ),
  },
  {
    label: "Sacola",
    href: "/carrinho",
    match: (p) => p.startsWith("/carrinho"),
    icon: () => (
      <svg viewBox="0 0 24 24" {...stroke} className="h-[22px] w-[22px]" aria-hidden>
        <path d="M8 8.5V7a4 4 0 0 1 8 0v1.5" />
        <path d="M4.6 8.5h14.8a.6.6 0 0 1 .6.66l-1.13 10.5A2 2 0 0 1 16.88 21.4H7.12a2 2 0 0 1-1.99-1.74L4 9.16a.6.6 0 0 1 .6-.66Z" />
      </svg>
    ),
  },
];

/** Ícone do atendente — imagem da marca já com fundo transparente
   (/brand/assistente-virtual.png, gerada via luminância→alpha). O zoom
   corta a margem vazia da arte pra o desenho preencher melhor o espaço. */
export function SupportIcon({ className = "h-[26px] w-[26px]" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden ${className}`}
    >
      <Image
        src="/brand/assistente-virtual.png"
        alt="Atendente Virtual"
        width={64}
        height={64}
        aria-hidden
        className="h-full w-full object-contain scale-[1.45] pointer-events-none select-none"
      />
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname() || "/";
  const { count, hydrated } = useCart();
  const { open: chatOpen, toggle: toggleChat, unread } = useChat();
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);
  const [hidden, setHidden] = useState(false);

  // Na página de produto a barra de compra (MobileBuyBar) fica empilhada
  // logo acima desta nav — então aqui ela não pode sumir no scroll, senão
  // abriria um vão embaixo da barra de compra.
  const isProduct = pathname.startsWith("/produto/");

  // Pop na sacola quando um item entra
  useEffect(() => {
    if (!hydrated) {
      prevCount.current = count;
      return;
    }
    if (count > prevCount.current) {
      setPop(true);
      const t = window.setTimeout(() => setPop(false), 450);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, hydrated]);

  // Esconde ao rolar pra baixo, mostra ao subir (comportamento de app)
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120);
        lastY = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Em /admin não há barra.
  if (pathname.startsWith("/admin")) return null;

  const isHidden = hidden && !isProduct;

  return (
    <nav
      aria-label="Navegação principal"
      className={`bottom-nav md:hidden fixed inset-x-0 bottom-0 z-40 px-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isHidden ? "translate-y-[160%]" : "translate-y-0"
      }`}
    >
      {/* Liquid Glass (iOS 26 / iPhone 17): pílula flutuante de vidro,
          translúcida, com brilho especular no topo e sombra suave. */}
      <ul
        className="relative mx-auto flex max-w-md items-stretch justify-around gap-0.5 rounded-[30px] border border-white/50 bg-white/55 px-2 py-1.5 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.35),0_2px_10px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_2px_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-150 overflow-hidden"
        style={{ WebkitBackdropFilter: "blur(24px) saturate(1.6)" }}
      >
        {/* Sheen especular: faixa de luz que escorre do topo (vidro líquido) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[30px] bg-gradient-to-b from-white/55 to-transparent"
        />
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const isBag = tab.href === "/carrinho";
          return (
            <li key={tab.href} className="relative flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors duration-200 active:scale-90 ${
                  active ? "text-foreground" : "text-foreground/45"
                }`}
              >
                <span className="relative inline-flex">
                  {tab.icon(active)}
                  {isBag && hydrated && count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-foreground text-background text-[9px] font-semibold leading-none flex items-center justify-center tabular-nums"
                      style={
                        pop
                          ? { animation: "hp-cart-pop 450ms cubic-bezier(.34,1.6,.64,1)" }
                          : undefined
                      }
                    >
                      {count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium tracking-wide leading-none">
                  {tab.label}
                </span>
                <span
                  aria-hidden
                  className={`absolute -bottom-0.5 h-1 w-1 rounded-full bg-foreground transition-all duration-300 ${
                    active ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  }`}
                />
              </Link>
            </li>
          );
        })}

        {/* Atendente Virtual — abre o chatbot (substitui a antiga FAB) */}
        <li className="relative flex-1">
          <button
            type="button"
            onClick={toggleChat}
            aria-label="Falar com o Atendente Virtual"
            aria-pressed={chatOpen}
            className={`group relative flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition-colors duration-200 active:scale-90 ${
              chatOpen ? "text-foreground" : "text-foreground/45"
            }`}
          >
            <span className="relative inline-flex">
              <SupportIcon />
              {unread && !chatOpen && (
                <span className="absolute -top-1 -right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </span>
            <span className="text-[10px] font-medium tracking-wide leading-none">
              Atendente
            </span>
            <span
              aria-hidden
              className={`absolute -bottom-0.5 h-1 w-1 rounded-full bg-foreground transition-all duration-300 ${
                chatOpen ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
            />
          </button>
        </li>
      </ul>
    </nav>
  );
}
