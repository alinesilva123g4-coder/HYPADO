"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileMenu } from "./MobileMenu";
import { CartButton } from "@/components/cart/CartButton";
import { AnnounceBar } from "./AnnounceBar";
import { SupportIcon } from "./BottomNav";
import { useChat } from "@/lib/chat";

const NAV_LEFT = [
  { label: "Blusas", href: "/categoria/Blusas" },
  { label: "Calças", href: "/categoria/Calças" },
  { label: "Shorts", href: "/categoria/Shorts" },
  { label: "Kits", href: "/categoria/Kits" },
];

const NAV_RIGHT = [
  { label: "Camisetas", href: "/categoria/Camisetas" },
  { label: "Chinelas", href: "/categoria/Chinelas" },
  { label: "Lookbook", href: "/lookbook" },
];

export function Header() {
  const pathname = usePathname();
  const { toggle: toggleChat, open: chatOpen, unread } = useChat();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    let current = false;
    const update = () => {
      const y = window.scrollY;
      // Histerese: encolhe em >64, só volta a expandir em <16.
      // Evita flicker quando o reflow do header sticky empurra o scrollY de volta pro limiar.
      const next = current ? y > 16 : y > 64;
      if (next !== current) {
        current = next;
        setScrolled(next);
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="sticky top-0 z-30">
      <AnnounceBar />
      <header
        className={`transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-line/80 shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(0,0,0,0.10)]"
            : "bg-background border-b border-transparent"
        }`}
      >
        <div
          className="mx-auto flex max-w-7xl items-center px-4 md:px-8 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            height: scrolled ? "var(--header-h-scrolled)" : "var(--header-h-base)",
          }}
        >
          {/* Left — hamburger on mobile, nav on desktop */}
          <div className="flex flex-1 items-center min-w-0">
            <div className="md:hidden">
              <MobileMenu />
            </div>
            <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.22em]">
              {NAV_LEFT.map((c) => (
                <NavLink key={c.href} {...c} active={pathname === c.href} />
              ))}
            </nav>
          </div>

          {/* Center — logo (altura anima junto pra não vazar) */}
          <div className="flex shrink-0 items-center justify-center overflow-hidden mx-4 md:mx-8">
            <Link
              href="/"
              aria-label="HYPADO"
              className="block group will-change-[height]"
              style={{
                height: scrolled
                  ? "var(--header-h-scrolled)"
                  : "var(--header-h-base)",
                transition: "height 500ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Image
                src="/brand/logo.png"
                alt="HYPADO"
                width={520}
                height={520}
                priority
                className="h-full w-auto object-contain py-2 md:py-3 transition-opacity duration-300 group-hover:opacity-85"
              />
            </Link>
          </div>

          {/* Right — nav (desktop) + cart */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-8 min-w-0">
            <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.22em]">
              {NAV_RIGHT.map((c) => (
                <NavLink key={c.href} {...c} active={pathname === c.href} />
              ))}
            </nav>
            <div className="hidden md:block h-5 w-px bg-line" aria-hidden />
            {/* Atendente Virtual — abre o chatbot (desktop; no mobile fica na barra inferior) */}
            <button
              type="button"
              onClick={toggleChat}
              aria-label="Falar com o Atendente Virtual"
              aria-pressed={chatOpen}
              title="Atendente Virtual"
              className={`hidden md:inline-flex relative h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-90 ${
                chatOpen ? "text-foreground" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <SupportIcon className="h-7 w-7" />
              {unread && !chatOpen && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </button>
            <div className="hidden md:block h-5 w-px bg-line" aria-hidden />
            <CartButton />
          </div>
        </div>
      </header>
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-2 py-1.5 transition-colors duration-200 ${
        active ? "text-foreground" : "text-foreground/65 hover:text-foreground"
      }`}
    >
      <span
        aria-hidden
        className={`h-1 w-1 rounded-full bg-foreground transition-all duration-300 ${
          active ? "opacity-100 scale-100" : "opacity-0 scale-50 -ml-3"
        }`}
      />
      <span className="relative">
        {label}
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 right-0 -bottom-1 h-px origin-left bg-foreground transition-transform duration-300 ease-out ${
            active ? "scale-x-0" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </span>
    </Link>
  );
}
