"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { useCart } from "@/lib/cart";
import { StarRating } from "@/components/product/StarRating";
import { Reviews } from "@/components/product/Reviews";
import { haptic, useToast } from "@/lib/feedback";
import { track } from "@/lib/track";
import {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackContact,
} from "@/lib/analytics";
import { SwipeGallery } from "./SwipeGallery";
import { MobileBuyBar } from "./MobileBuyBar";

type Variant = { id: string; size: string; color: string | null; stock: number };
type ProductImage = { id: string; url: string };
type Reply = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date | string;
};
type Review = {
  id: string;
  rating: number;
  authorName: string;
  city: string | null;
  title: string | null;
  body: string;
  verified: boolean;
  media: string | null;
  likes: number;
  dislikes: number;
  createdAt: Date | string;
  replies?: Reply[];
};
type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  images: ProductImage[];
  variants: Variant[];
  reviews: Review[];
};

type RelatedProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  images: ProductImage[];
  rating?: number;
  reviewCount?: number;
};

const CATEGORY_HIGHLIGHTS: Record<
  string,
  { tagline: string; features: { label: string; value: string }[]; details: string[] }
> = {
  Blusas: {
    tagline: "Modelagem oversized, algodão pesado e atitude nordestina.",
    features: [
      { label: "Tecido", value: "Algodão pesado 240g" },
      { label: "Caimento", value: "Oversized" },
      { label: "Estampa", value: "Silk de alta durabilidade" },
      { label: "Origem", value: "Costurada no Nordeste" },
    ],
    details: [
      "Modelagem ampla que cai bem em qualquer biotipo.",
      "Gola canelada reforçada. Não deforma na lavagem.",
      "Estampa em silk com acabamento fosco que não craquela.",
    ],
  },
  Camisetas: {
    tagline: "Algodão peruano, acabamento premium e caimento que valoriza.",
    features: [
      { label: "Tecido", value: "Algodão peruano 180g" },
      { label: "Caimento", value: "Regular fit" },
      { label: "Estampa", value: "DTF de alta definição" },
      { label: "Origem", value: "Produção nordestina" },
    ],
    details: [
      "Toque macio, fio penteado que não pinica a pele.",
      "Costura reforçada nas laterais. Peça pra durar.",
      "Lave do avesso pra prolongar a vida da estampa.",
    ],
  },
  Calças: {
    tagline: "Jeans skinny premium, lavagem marcada e caimento que valoriza.",
    features: [
      { label: "Tecido", value: "Jeans com elastano" },
      { label: "Caimento", value: "Skinny fit" },
      { label: "Lavagem", value: "Acabamento premium" },
      { label: "Bolsos", value: "Cinco bolsos clássicos" },
    ],
    details: [
      "Elastano na trama pra ajustar ao corpo sem perder o conforto.",
      "Lavagem trabalhada que segura a cor lavagem após lavagem.",
      "Costura reforçada nos pontos de tensão. Peça pra durar.",
    ],
  },
  Shorts: {
    tagline: "Tactel premium, caimento moderno. Leve pra qualquer rolê.",
    features: [
      { label: "Tecido", value: "Tactel premium" },
      { label: "Caimento", value: "Modern fit" },
      { label: "Cordão", value: "Ajustável com regulador" },
      { label: "Bolsos", value: "Dois laterais + traseiro" },
    ],
    details: [
      "Tecido leve, seca rápido. Bom pra praia e pro dia a dia.",
      "Cintura com elástico interno e cordão pra ajuste perfeito.",
      "Forro interno em malha pra mais conforto.",
    ],
  },
  Chinelas: {
    tagline: "Conforto absurdo e a identidade do nordeste em cada passo.",
    features: [
      { label: "Solado", value: "EVA injetado anti-derrapante" },
      { label: "Tira", value: "PVC macio reforçado" },
      { label: "Palmilha", value: "Anatômica" },
      { label: "Origem", value: "Fabricação nordestina" },
    ],
    details: [
      "Palmilha anatômica que abraça o pé desde o primeiro uso.",
      "Solado emborrachado com aderência mesmo em piso molhado.",
      "Tira costurada e rebitada. Não solta no aperto.",
    ],
  },
  Kits: {
    tagline: "Peças combinadas. Streetwear nordestino em conjunto completo.",
    features: [
      { label: "Conteúdo", value: "Peças coordenadas" },
      { label: "Tecido", value: "Algodão + tactel premium" },
      { label: "Caimento", value: "Oversized + modern fit" },
      { label: "Origem", value: "Produção nordestina" },
    ],
    details: [
      "Looks completos pensados pra combinar de cara.",
      "Materiais premium nas duas peças. Mesmo padrão de qualidade.",
      "Economia em relação a comprar separado.",
    ],
  },
};

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: RelatedProduct[];
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);
  const router = useRouter();
  const { add } = useCart();
  const toast = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    track("product_view", {
      productId: product.id,
      meta: { slug: product.slug, category: product.category, priceCents: product.priceCents },
    });
    trackViewContent({
      id: product.id,
      name: product.name,
      category: product.category,
      priceCents: product.priceCents,
    });
  }, [product.id, product.name, product.slug, product.category, product.priceCents]);

  // Cores disponíveis (produtos sem cor seguem só por tamanho, como antes).
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c)),
  );
  const hasColors = colors.length > 0;
  // Variantes visíveis pro seletor de tamanho dependem da cor escolhida.
  const visibleVariants = hasColors
    ? product.variants.filter((v) => v.color === selectedColor)
    : product.variants;
  const selectedVariant = visibleVariants.find((v) => v.size === selectedSize);
  const outOfStock = selectedVariant && selectedVariant.stock === 0;
  const needsColor = hasColors && !selectedColor;

  function pickColor(c: string) {
    setSelectedColor(c);
    setSelectedSize(null); // estoque muda por cor — força reescolher o tamanho
  }

  function handleAdd() {
    if (!selectedSize || needsColor || outOfStock) return;
    const variantLabel = [selectedColor, selectedSize].filter(Boolean).join(" · ");
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images[0]?.url ?? "",
      size: selectedSize,
      color: selectedColor ?? undefined,
      priceCents: product.priceCents,
    });
    trackAddToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      priceCents: product.priceCents,
      size: selectedSize,
      qty: 1,
    });
    haptic([8, 30, 14]);
    toast.show({
      text: `${product.name} (${variantLabel}) adicionado`,
      variant: "success",
      href: "/carrinho",
      hrefLabel: "ver sacola",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const highlights =
    CATEGORY_HIGHLIGHTS[product.category] ?? {
      tagline: product.description,
      features: [],
      details: [],
    };

  const buyMessage = `Olá, HYPADO! Quero comprar:\n\n*${product.name}*\n${
    hasColors ? `Cor: ${selectedColor ?? "?"}\n` : ""
  }Tamanho: ${
    selectedSize ?? "?"
  }\nPreço: ${formatBRL(product.priceCents)}\nLink: ${pageUrl}`;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buyMessage)}`;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-8">
        <nav className="text-[11px] md:text-xs text-muted">
          <Link href="/" className="hover:text-foreground">Início</Link>
          <span className="mx-2">/</span>
          <Link href={`/categoria/${product.category}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-12 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-16">
        {/* Gallery */}
        <SwipeGallery
          images={product.images}
          alt={product.name}
          active={activeImage}
          onChange={setActiveImage}
        />

        {/* Details */}
        <div className="flex flex-col">
          <div className="eyebrow text-[9px] md:text-[10px]">
            {product.category} · HYPADO
          </div>
          <h1 className="mt-2 md:mt-3 text-2xl md:text-5xl font-medium leading-[1.1] md:leading-[1.05] tracking-tight">
            {product.name}
          </h1>

          <a
            href="#avaliacoes"
            className="mt-3 md:mt-4 inline-flex items-center gap-2 group"
          >
            <StarRating
              rating={
                product.reviews.length > 0
                  ? product.reviews.reduce((s, r) => s + r.rating, 0) /
                    product.reviews.length
                  : 0
              }
              size="md"
            />
            <span className="text-xs text-[#F5B400] group-hover:underline underline-offset-4">
              {product.reviews.length > 0
                ? `${product.reviews.length} ${product.reviews.length === 1 ? "avaliação" : "avaliações"}`
                : "Seja o primeiro a avaliar"}
            </span>
          </a>

          <p className="mt-4 md:mt-5 text-sm md:text-xl leading-relaxed text-foreground/85 font-light">
            {highlights.tagline}
          </p>

          <div className="mt-4 md:mt-6 flex items-baseline gap-2 md:gap-3 flex-wrap">
            <span className="text-2xl md:text-3xl tabular-nums font-medium">{formatBRL(product.priceCents)}</span>
            <span className="text-[11px] md:text-xs text-muted">
              ou 3x de {formatBRL(product.priceCents / 3)} sem juros
            </span>
          </div>

          {hasColors && (
            <div className="mt-6 md:mt-10">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <div className="text-[11px] md:text-xs uppercase tracking-widest">Cor</div>
                {selectedColor && (
                  <span className="text-[11px] md:text-xs text-muted">· {selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => pickColor(c)}
                      className={`px-4 py-2.5 md:py-3 text-sm border rounded-md transition-all ${
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-line hover:border-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 md:mt-10">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="text-[11px] md:text-xs uppercase tracking-widest">Tamanho</div>
              <button className="text-[11px] md:text-xs underline underline-offset-4 text-muted hover:text-foreground">
                Guia de medidas
              </button>
            </div>
            {needsColor ? (
              <div className="text-xs text-muted">Selecione a cor primeiro.</div>
            ) : (
            <div className="flex flex-wrap gap-2">
              {visibleVariants.map((v) => {
                const isSelected = selectedSize === v.size;
                const isOut = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    disabled={isOut}
                    onClick={() => setSelectedSize(v.size)}
                    className={`min-w-11 px-3 md:px-4 py-2.5 md:py-3 text-sm border rounded-md transition-all ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-line hover:border-foreground"
                    } ${isOut ? "line-through opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
            )}
            {selectedVariant && !outOfStock && (
              <div className="mt-3 text-xs text-muted">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 align-middle" />
                {selectedVariant.stock} em estoque
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8 flex flex-col gap-2.5 md:gap-3">
            <button
              onClick={handleAdd}
              disabled={needsColor || !selectedSize || outOfStock}
              className="btn-trace btn-outline w-full bg-foreground text-background py-3.5 md:py-4 text-xs md:text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:bg-line disabled:text-muted disabled:cursor-not-allowed transition-colors rounded-md"
            >
              {needsColor
                ? "Selecione a cor"
                : !selectedSize
                ? "Selecione um tamanho"
                : outOfStock
                ? "Esgotado"
                : added
                ? "Adicionado"
                : "Adicionar à sacola"}
            </button>
            {added && (
              <button
                onClick={() => router.push("/carrinho")}
                className="text-xs uppercase tracking-widest text-muted hover:text-foreground underline underline-offset-4"
              >
                Ver sacola →
              </button>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackInitiateCheckout({
                  ids: [product.id],
                  value: product.priceCents / 100,
                  num_items: 1,
                });
                trackContact("whatsapp");
              }}
              className={`w-full bg-[#25D366] text-white py-3.5 md:py-4 text-center text-xs md:text-sm uppercase tracking-widest hover:bg-[#1FB755] transition-colors rounded-md inline-flex items-center justify-center gap-2 ${
                needsColor || !selectedSize ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
                className="h-4 w-4"
              >
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.1 2.9c.1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5a9.5 9.5 0 0 1-4.8-1.3l-.3-.2-3.6.9 1-3.5-.2-.4A9.5 9.5 0 1 1 12 21.5m0-21A11.5 11.5 0 0 0 2.1 17.9L.5 23.5l5.7-1.5A11.5 11.5 0 1 0 12 .5" />
              </svg>
              Comprar via WhatsApp
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2 text-center border-y border-line py-4 md:py-5">
            <div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted">Envio</div>
              <div className="mt-1 text-[11px] md:text-xs">Todo Brasil</div>
            </div>
            <div className="border-x border-line">
              <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted">Trocas</div>
              <div className="mt-1 text-[11px] md:text-xs">Em 7 dias</div>
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted">Pagamento</div>
              <div className="mt-1 text-[11px] md:text-xs">Em até 3x</div>
            </div>
          </div>
        </div>
      </section>

      {/* Description — destaque, papel de cordel (bg-sand) */}
      <section className="bg-sand cordel-edge">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
          <div className="md:col-span-4">
            <div className="eyebrow text-[9px] md:text-[10px]">Sobre a peça</div>
            <h2 className="mt-2 md:mt-3 text-2xl md:text-4xl font-medium leading-tight tracking-tight">
              Feito pra durar, pensado pra você.
            </h2>
          </div>

          <div className="md:col-span-8 md:pl-8 md:border-l border-foreground/10">
            <p className="text-base md:text-2xl leading-relaxed font-light text-foreground/90">
              {product.description}
            </p>

            {highlights.details.length > 0 && (
              <ul className="mt-6 md:mt-10 space-y-3 md:space-y-4">
                {highlights.details.map((d, i) => (
                  <li key={i} className="flex gap-3 md:gap-4 text-sm md:text-base leading-relaxed">
                    <span className="mt-2.5 inline-block h-[2px] w-5 md:w-6 bg-clay flex-shrink-0" />
                    <span className="text-foreground/85">{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Specs */}
      {highlights.features.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20">
          <div className="eyebrow text-[9px] md:text-[10px] mb-5 md:mb-10">
            Especificações
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
            {highlights.features.map((f) => (
              <div key={f.label} className="bg-background p-4 md:p-8">
                <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted">
                  {f.label}
                </div>
                <div className="mt-2 md:mt-3 text-sm md:text-lg font-medium leading-snug">
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Care & shipping */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-12 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line">
          <div className="bg-background p-5 md:p-8">
            <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted mb-2 md:mb-3">
              Cuidados
            </div>
            <p className="text-[13px] md:text-sm leading-relaxed text-foreground/80">
              Lave do avesso em água fria. Não use alvejante. Seque à sombra
              pra preservar cor e estampa.
            </p>
          </div>
          <div className="bg-background p-5 md:p-8">
            <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted mb-2 md:mb-3">
              Entrega
            </div>
            <p className="text-[13px] md:text-sm leading-relaxed text-foreground/80">
              Despacho em até 2 dias úteis. Envio para todo o Brasil via
              Correios ou transportadora.
            </p>
          </div>
          <div className="bg-background p-5 md:p-8">
            <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted mb-2 md:mb-3">
              Devoluções
            </div>
            <p className="text-[13px] md:text-sm leading-relaxed text-foreground/80">
              Trocas e devoluções em até 7 dias. Produto deve estar lacrado,
              sem uso, com etiqueta.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <div id="avaliacoes">
        <Reviews
          productId={product.id}
          productName={product.name}
          initialReviews={product.reviews}
        />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16 border-t border-line">
          <div className="eyebrow text-[9px] md:text-[10px]">
            Você também pode gostar
          </div>
          <h2 className="mt-1.5 md:mt-2 text-lg md:text-3xl font-medium mb-5 md:mb-10">
            Mais de {product.category}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-6 md:gap-y-10">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                category={p.category}
                priceCents={p.priceCents}
                image={p.images[0]?.url ?? ""}
                imageHover={p.images[1]?.url}
                rating={p.rating}
                reviewCount={p.reviewCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Espaço pra não ser coberto pela bottom bar mobile */}
      <div className="md:hidden h-20" aria-hidden />

      <MobileBuyBar
        priceCents={product.priceCents}
        variants={visibleVariants}
        colors={colors}
        selectedColor={selectedColor}
        onSelectColor={pickColor}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onConfirm={handleAdd}
      />
    </>
  );
}
