"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";

const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM || "hypado_of";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  const waLink = whatsappLink("Olá, vim do site da HYPADO");
  const igUrl = `https://instagram.com/${INSTAGRAM}`;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 md:mt-28 border-t border-line bg-background">
      {/* Brand centerpiece */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-16 pb-8 md:pb-10 flex flex-col items-center text-center">
        <Link
          href="/"
          aria-label="HYPADO · início"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="HYPADO"
            className="h-16 md:h-28 w-auto object-contain"
          />
        </Link>
        <p className="mt-4 text-xs md:text-sm text-muted max-w-md leading-relaxed">
          Streetwear nordestino. Peças premium com pegada de rua, feitas
          pra quem carrega o norte/nordeste no peito.
        </p>

        <div className="mt-6 flex items-center gap-2.5">
          <SocialIcon
            href={igUrl}
            label="Instagram da HYPADO"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <rect x="3" y="3" width="18" height="18" rx="5.5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
              </svg>
            }
          />
          <SocialIcon
            href={waLink}
            label="WhatsApp da HYPADO"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                <path d="M19.05 4.91A10 10 0 0 0 4.93 19.04L3 22l3.06-1.9a10 10 0 0 0 12.99-15.19Zm-7.08 15.4h-.01a8.3 8.3 0 0 1-4.22-1.16l-.3-.18-2.5.66.67-2.44-.2-.31a8.3 8.3 0 1 1 6.56 3.43Zm4.81-6.22c-.26-.13-1.56-.77-1.8-.85-.24-.09-.42-.13-.6.13-.17.26-.69.85-.84 1.02-.16.18-.31.2-.57.07a6.78 6.78 0 0 1-2-1.23 7.5 7.5 0 0 1-1.38-1.72c-.15-.26 0-.4.11-.53.12-.12.26-.31.39-.46.13-.16.17-.27.26-.45.09-.18.04-.34-.02-.47-.06-.13-.6-1.43-.82-1.95-.21-.51-.43-.44-.59-.45h-.5a.97.97 0 0 0-.7.33 2.94 2.94 0 0 0-.93 2.2c0 1.3.94 2.55 1.07 2.72.13.17 1.85 2.83 4.49 3.97.63.27 1.12.43 1.5.55.63.2 1.21.18 1.66.11.51-.08 1.56-.64 1.78-1.26.22-.62.22-1.15.16-1.26-.07-.11-.24-.18-.5-.31Z" />
              </svg>
            }
          />
          <SocialIcon
            href="mailto:contato@hypado.com.br"
            label="Email HYPADO"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="m3.5 7 7.6 5.5a1.5 1.5 0 0 0 1.8 0L20.5 7" />
              </svg>
            }
          />
          <SocialIcon
            href="https://www.tiktok.com/@hypado_of"
            label="TikTok da HYPADO"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                <path d="M16.5 3c.4 2.1 1.6 3.5 3.7 4v3a7.3 7.3 0 0 1-3.7-1.1v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.06v3.1a2.6 2.6 0 1 0 1.8 2.47V3h3Z" />
              </svg>
            }
          />
        </div>
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
        >
          @{INSTAGRAM}
        </a>
      </div>

      {/* Link columns */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 text-sm">
          <div>
            <FooterHeading>Coleção</FooterHeading>
            <FooterList>
              <FooterLink href="/categoria/Blusas">Blusas</FooterLink>
              <FooterLink href="/categoria/Camisetas">Camisetas</FooterLink>
              <FooterLink href="/categoria/Shorts">Shorts</FooterLink>
              <FooterLink href="/categoria/Chinelas">Chinelas</FooterLink>
              <FooterLink href="/categoria/Kits">Kits</FooterLink>
            </FooterList>
          </div>

          <div>
            <FooterHeading>Loja</FooterHeading>
            <FooterList>
              <FooterLink href="/sobre">Sobre a marca</FooterLink>
              <FooterLink href="/lookbook">Lookbook</FooterLink>
              <FooterLink href="/">Drops</FooterLink>
              <FooterLink href="/carrinho">Sacola</FooterLink>
            </FooterList>
          </div>

          <div className="col-span-2 md:col-span-1">
            <FooterHeading>Atendimento</FooterHeading>
            <ul className="space-y-2.5 md:space-y-3 text-xs md:text-sm">
              <li>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  <span>WhatsApp · (88) 8162-3640</span>
                </a>
              </li>
              <li>
                <Link href="/contato" className="text-foreground/80 hover:text-foreground transition-colors">
                  Trocas e devoluções
                </Link>
              </li>
              <li>
                <Link href="/politica" className="text-foreground/80 hover:text-foreground transition-colors">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-foreground/80 hover:text-foreground transition-colors">
                  Frete e entrega
                </Link>
              </li>
            </ul>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/60 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
              </span>
              Online · seg a sex, 9h às 18h
            </div>
          </div>
        </div>
      </div>

      {/* Trust row */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 md:py-6 flex flex-wrap items-center justify-center md:justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-muted">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 2 4 5v6c0 4.5 3.4 8.7 8 10 4.6-1.3 8-5.5 8-10V5l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect x="2.5" y="6" width="19" height="12" rx="2" />
              <path d="M2.5 10h19M6 15h3" />
            </svg>
            <span>Pix · Cartão · Boleto</span>
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 7h11l1.5 3H21l-1 7h-3" />
              <path d="M3 7v9h2" />
              <circle cx="7.5" cy="17.5" r="2" />
              <circle cx="17.5" cy="17.5" r="2" />
            </svg>
            <span>Envio Brasil todo</span>
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 12a9 9 0 1 0 9-9" />
              <path d="M3 4v5h5" />
            </svg>
            <span>Troca em 7 dias</span>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] md:text-[11px] text-muted text-center sm:text-left">
          <div>© {year} HYPADO · north east. Todos os direitos reservados.</div>
          <div className="uppercase tracking-[0.3em]">Feito no Nordeste, Brasil</div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      aria-label={label}
      className="group relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-line text-foreground/70 hover:text-background hover:border-foreground transition-colors overflow-hidden"
    >
      <span className="absolute inset-0 -translate-y-full bg-foreground transition-transform duration-300 ease-out group-hover:translate-y-0" />
      <span className="relative">{icon}</span>
    </a>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-muted mb-3 md:mb-4">
      {children}
    </div>
  );
}

function FooterList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2.5 md:space-y-3 text-xs md:text-sm">{children}</ul>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors"
      >
        <span className="relative">
          {children}
          <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
        </span>
      </Link>
    </li>
  );
}
