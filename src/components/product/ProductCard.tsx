import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { StarRating } from "./StarRating";

type Props = {
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  image: string;
  imageHover?: string;
  rating?: number;
  reviewCount?: number;
};

export function ProductCard({
  slug,
  name,
  category,
  priceCents,
  image,
  imageHover,
  rating,
  reviewCount,
}: Props) {
  const hasRating = typeof rating === "number" && (reviewCount ?? 0) > 0;

  return (
    <Link
      href={`/produto/${slug}`}
      className="group block transition-transform duration-200 ease-out active:scale-[0.97]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0 group-hover:scale-[1.04]"
        />
        {imageHover && (
          <Image
            src={imageHover}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 768px) 0px, 25vw"
            className="hidden md:block object-cover scale-[1.04] opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:scale-100"
          />
        )}

        {/* Moldura editorial — borda fina some no hover dando lugar ao CTA */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-black/0 md:border-black/10 transition-colors duration-300 group-hover:border-black/0"
        />

        {/* Faixa editorial subindo do rodapé (desktop) — substitui o traço fino */}
        <div
          aria-hidden
          className="hidden md:flex absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] bg-ink text-white items-center justify-between px-3 py-2"
        >
          <span className="brand-mark text-[10px] uppercase tracking-[0.22em]">
            Ver peça
          </span>
          <span className="text-sm leading-none" aria-hidden>
            →
          </span>
        </div>
      </div>

      <div className="mt-3 md:mt-4">
        {/* Eyebrow com marcador de barro */}
        <div className="eyebrow text-[9px] md:text-[10px] text-muted transition-colors duration-300 group-hover:text-foreground">
          {category}
        </div>

        {/* Nome — editorial, duas linhas máx */}
        <h3 className="brand-mark mt-1.5 md:mt-2 text-[13px] md:text-[15px] leading-[1.15] uppercase tracking-[0.01em] line-clamp-2 min-h-[2.3em]">
          {name}
        </h3>

        {/* Régua hachurada — divisor tátil */}
        <div className="hatch-rule mt-2 md:mt-3" />

        {/* Rodapé: rating à esquerda, preço à direita */}
        <div className="mt-2 md:mt-2.5 flex items-end justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-1.5 min-h-[14px]">
            <StarRating rating={hasRating ? rating! : 0} size="sm" />
            {hasRating && (
              <span className="text-[9px] md:text-[10px] text-muted tabular-nums">
                ({reviewCount})
              </span>
            )}
          </div>
          <div className="brand-mark text-[13px] md:text-[15px] tabular-nums whitespace-nowrap leading-none">
            {formatBRL(priceCents)}
          </div>
        </div>
      </div>
    </Link>
  );
}
