"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";

const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM || "hypado_of";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "558881623640";

/** Formata o número da env (com DDI 55) para exibição: (88) 8162-3640 / (88) 99999-9999 */
function formatWhatsappDisplay(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length < 10) return raw;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const mid = rest.length > 8 ? 5 : 4; // celular (9 díg.) vs fixo (8 díg.)
  return `(${ddd}) ${rest.slice(0, mid)}-${rest.slice(mid)}`;
}

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  const waLink = whatsappLink("Olá, vim do site da HYPADO");
  const igUrl = `https://instagram.com/${INSTAGRAM}`;
  const waDisplay = formatWhatsappDisplay(WHATSAPP);
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-16 md:mt-28"
      style={
        {
          "--background": "#0a0a0a",
          "--foreground": "#ffffff",
          "--muted": "rgba(255,255,255,0.6)",
          "--line": "rgba(255,255,255,0.14)",
          isolation: "isolate",
          // Minimalista: preto profundo e uniforme, com um único respiro de luz
          // fria no topo (logo) que dissolve pro escuro. Sem textura, sem ruído.
          background:
            "radial-gradient(85% 55% at 50% 0%, rgba(255,255,255,0.045) 0%, transparent 60%)," +
            "#080808",
        } as React.CSSProperties
      }
    >
      <WaveDivider />

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
      </div>

      {/* Link columns */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 text-sm">
          <div>
            <FooterHeading>Coleção</FooterHeading>
            <FooterList>
              <FooterLink href="/categoria/Blusas">Blusas</FooterLink>
              <FooterLink href="/categoria/Camisetas">Camisetas</FooterLink>
              <FooterLink href="/categoria/Calças">Calças</FooterLink>
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
                  <span>WhatsApp · {waDisplay}</span>
                </a>
              </li>
              <li>
                <Link href="/contato" className="text-foreground/80 hover:text-foreground transition-colors">
                  Trocas e devoluções
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-foreground/80 hover:text-foreground transition-colors">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/politica" className="text-foreground/80 hover:text-foreground transition-colors">
                  Frete e entrega
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security seal */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/selo.png"
            alt="Selo de segurança HYPADO"
            className="h-12 md:h-14 w-auto object-contain"
            style={{ animation: "none" }}
          />
          <div className="text-center sm:text-left max-w-xs">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted">Site verificado</div>
            <div className="mt-1 text-xs md:text-sm text-foreground/80 leading-relaxed">
              Compra protegida, dados criptografados e atendimento humano em todas as etapas.
            </div>
          </div>
        </div>
      </div>

      {/* Pagamento + entrega */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 flex flex-col items-center md:items-start gap-2.5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted">Formas de pagamento</div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <PayMarkImg label="Pix" src="/brand/pix.png" />
            <PayMark label="Visa"><VisaMark /></PayMark>
            <PayMark label="Mastercard"><MastercardMark /></PayMark>
            <PayMarkImg label="Elo" src="/brand/elo.png" />
            <PayMark label="Hipercard"><HipercardMark /></PayMark>
            <PayMark label="Boleto"><BoletoMark /></PayMark>
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

/** Onda animada na divisão branco (home) → preto (footer).
   Três camadas de profundidade no mesmo sentido (parallax suave) + um degradê
   sutil na onda da frente, dando dimensão sobre o preto do rodapé.
   Path = topo reto em y=0 (branco), borda inferior ondulada. 8 segmentos de
   150px = 1200 de largura, com 2 períodos por bloco de 600 → loop perfeito ao
   transladar -50% num SVG de 200% de largura. */
function WaveDivider() {
  // Curva inferior com cristas suaves e arredondadas. O topo fecha bem acima
  // (y=-40) pra que a respiração vertical nunca exponha o fundo no limite de cima.
  const wavePath =
    "M0,44 q75,-24,150,0 q75,24,150,0 q75,-24,150,0 q75,24,150,0 " +
    "q75,-24,150,0 q75,24,150,0 q75,-24,150,0 q75,24,150,0 L1200,-40 L0,-40 Z";

  const layers = [
    { speed: 13, opacity: 0.12, dy: 14, bob: "4px", bobDur: "8s", bobDelay: "0s" }, // fundo distante
    { speed: 11, opacity: 0.28, dy: 7, bob: "3px", bobDur: "6.5s", bobDelay: "-2.5s" }, // meio
  ];

  return (
    <div
      aria-hidden
      className="absolute left-0 right-0 top-0 h-12 md:h-[4.5rem] overflow-hidden pointer-events-none"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="hp-wave-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ececec" />
          </linearGradient>
        </defs>
      </svg>

      {/* Camadas de profundidade — drift horizontal (svg) + respiração vertical (g) */}
      {layers.map((l, i) => (
        <svg
          key={i}
          className="hp-wave-anim absolute inset-0 h-full w-[200%]"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
          style={{ animation: `hp-wave-drift ${l.speed}s linear infinite` }}
        >
          <g
            className="hp-wave-bob"
            style={
              {
                "--bob": l.bob,
                "--bob-dur": l.bobDur,
                "--bob-delay": l.bobDelay,
              } as React.CSSProperties
            }
          >
            <path d={wavePath} fill="#ffffff" opacity={l.opacity} transform={`translate(0,${l.dy})`} />
          </g>
        </svg>
      ))}

      {/* Camada da frente — onda principal com degradê sutil */}
      <svg
        className="hp-wave-anim absolute inset-0 h-full w-[200%]"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        style={{ animation: "hp-wave-drift 9s linear infinite" }}
      >
        <g
          className="hp-wave-bob"
          style={{ "--bob": "2.5px", "--bob-dur": "5.5s", "--bob-delay": "-1s" } as React.CSSProperties}
        >
          <path d={wavePath} fill="url(#hp-wave-grad)" />
        </g>
      </svg>
    </div>
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

function PayMark({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center h-9 md:h-10 w-14 md:w-16 rounded-lg border border-white/10 bg-white/[0.04]"
    >
      {children}
    </span>
  );
}

function PayMarkImg({ label, src }: { label: string; src: string }) {
  // Bandeira via imagem oficial — selo branco pra ficar legível sobre o rodapé escuro.
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center h-9 md:h-10 w-14 md:w-16 rounded-lg border border-white/10 bg-white/[0.04]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="max-h-4 md:max-h-[18px] w-auto object-contain" />
    </span>
  );
}

function VisaMark() {
  // Wordmark branca com barras azul (topo) e amarela (base).
  return (
    <svg viewBox="0 0 56 24" className="h-4 md:h-[18px] w-auto" aria-hidden>
      <rect x="6" y="3.5" width="44" height="2.4" fill="#1A1F71" />
      <rect x="6" y="18.1" width="44" height="2.4" fill="#F7B600" />
      <text
        x="28"
        y="16.5"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="14"
        fontStyle="italic"
        fontWeight="900"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  // Dois círculos sobrepostos: vermelho + laranja, interseção âmbar.
  return (
    <svg viewBox="0 0 40 24" className="h-5 md:h-6 w-auto" aria-hidden>
      <circle cx="16" cy="12" r="8" fill="#EB001B" />
      <circle cx="24" cy="12" r="8" fill="#F79E1B" />
      <path
        d="M20 5.6a8 8 0 0 1 0 12.8 8 8 0 0 1 0-12.8Z"
        fill="#FF5F00"
      />
    </svg>
  );
}


function HipercardMark() {
  // Parallelogramo vermelho com "HIPERCARD" branco em itálico.
  return (
    <svg viewBox="0 0 64 24" className="h-4 md:h-[18px] w-auto" aria-hidden>
      <path d="M8 4 H60 L56 20 H4 Z" fill="#B0202E" />
      <text
        x="32"
        y="15.5"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="8"
        fontStyle="italic"
        fontWeight="800"
        letterSpacing="0.2"
      >
        HIPERCARD
      </text>
    </svg>
  );
}

function BoletoMark() {
  // Código de barras branco.
  return (
    <svg viewBox="0 0 40 24" className="h-5 md:h-6 w-auto" fill="#ffffff" aria-hidden>
      <rect x="6" y="5" width="1.8" height="14" />
      <rect x="9.5" y="5" width="1" height="14" />
      <rect x="12.5" y="5" width="2.4" height="14" />
      <rect x="16.5" y="5" width="1" height="14" />
      <rect x="19" y="5" width="1.8" height="14" />
      <rect x="22.5" y="5" width="3" height="14" />
      <rect x="27" y="5" width="1" height="14" />
      <rect x="30" y="5" width="1.8" height="14" />
      <rect x="33.5" y="5" width="2.4" height="14" />
    </svg>
  );
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
