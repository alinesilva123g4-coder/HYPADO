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
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface rounded-md">
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
        {/* Talho de barro — cresce da esquerda no hover (desktop). Tátil, sem tag. */}
        <span
          aria-hidden
          className="hidden md:block absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-clay transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
        />
      </div>
      <div className="mt-2 md:mt-3 flex items-start justify-between gap-2 md:gap-4">
        <div className="min-w-0">
          <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted transition-colors duration-300 group-hover:text-clay">
            {category}
          </div>
          <div className="mt-0.5 md:mt-1 text-xs md:text-sm font-medium truncate">{name}</div>
          <div className="mt-1 md:mt-1.5 flex items-center gap-1 md:gap-1.5">
            <StarRating rating={hasRating ? rating! : 0} size="sm" />
            {hasRating && (
              <span className="text-[9px] md:text-[10px] text-[#F5B400] tabular-nums">
                ({reviewCount})
              </span>
            )}
          </div>
        </div>
        <div className="text-xs md:text-sm tabular-nums whitespace-nowrap">{formatBRL(priceCents)}</div>
      </div>
    </Link>
  );
}
