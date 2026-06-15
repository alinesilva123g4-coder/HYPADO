"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatBRL } from "@/lib/format";
import { haptic } from "@/lib/feedback";

type Variant = { id: string; size: string; stock: number };

export function MobileBuyBar({
  priceCents,
  variants,
  colors = [],
  selectedColor = null,
  onSelectColor,
  selectedSize,
  onSelectSize,
  onConfirm,
}: {
  priceCents: number;
  variants: Variant[];
  colors?: string[];
  selectedColor?: string | null;
  onSelectColor?: (c: string) => void;
  selectedSize: string | null;
  onSelectSize: (s: string) => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const selectedVariant = variants.find((v) => v.size === selectedSize);
  const outOfStock = selectedVariant?.stock === 0;
  const hasColors = colors.length > 0;
  const needsColor = hasColors && !selectedColor;

  function handleCta() {
    if (needsColor || !selectedSize) {
      setSheetOpen(true);
      return;
    }
    if (outOfStock) return;
    onConfirm();
    setSheetOpen(false);
  }

  function pickSize(size: string) {
    haptic(6);
    onSelectSize(size);
  }

  function pickColor(c: string) {
    haptic(6);
    onSelectColor?.(c);
  }

  return (
    <>
      {/* Barra de compra — mobile only. Fica empilhada logo acima da BottomNav
          (que volta a aparecer no produto), por isso o offset de 58px. */}
      <div className="md:hidden fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-[80] bg-background/95 backdrop-blur-md border-t border-line">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-[0.25em] text-muted">
              {selectedSize ? `Tamanho · ${selectedSize}` : "A partir de"}
            </span>
            <span className="text-lg font-medium tabular-nums leading-tight">
              {formatBRL(priceCents)}
            </span>
          </div>
          <button
            onClick={handleCta}
            disabled={outOfStock}
            className="ml-auto bg-foreground text-background px-5 py-3 rounded-md text-xs uppercase tracking-widest font-medium active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {outOfStock
              ? "Esgotado"
              : needsColor
              ? "Escolher cor"
              : selectedSize
              ? "Adicionar"
              : "Escolher tamanho"}
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {mounted &&
        createPortal(
          <div
            aria-hidden={!sheetOpen}
            className={`md:hidden fixed inset-0 z-[110] transition-opacity duration-300 ${
              sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div
              className={`absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
                sheetOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setSheetOpen(false)}
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-background rounded-t-2xl shadow-2xl"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
                animation: sheetOpen
                  ? "hp-sheet-in 360ms cubic-bezier(.22,1,.36,1) both"
                  : undefined,
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1 w-10 rounded-full bg-line" />
              </div>

              <div className="px-5 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted">
                      {needsColor ? "Cor" : "Tamanho"}
                    </div>
                    <h3 className="mt-1 text-lg font-medium">
                      {needsColor ? "Escolha a cor" : "Escolha o tamanho"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSheetOpen(false)}
                    aria-label="Fechar"
                    className="h-9 w-9 -mr-2 flex items-center justify-center text-foreground/60 active:scale-90 transition-transform"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {hasColors && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-2">
                      Cor
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => {
                        const isSelected = selectedColor === c;
                        return (
                          <button
                            key={c}
                            onClick={() => pickColor(c)}
                            className={`px-4 py-3 text-sm border rounded-md transition-all active:scale-95 ${
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

                {needsColor ? (
                  <div className="text-xs text-muted">
                    Selecione a cor pra ver os tamanhos.
                  </div>
                ) : (
                <div className="grid grid-cols-4 gap-2">
                  {variants.map((v) => {
                    const isSelected = selectedSize === v.size;
                    const isOut = v.stock === 0;
                    return (
                      <button
                        key={v.id}
                        disabled={isOut}
                        onClick={() => pickSize(v.size)}
                        className={`relative py-4 text-sm border rounded-md transition-all active:scale-95 ${
                          isSelected
                            ? "border-foreground bg-foreground text-background"
                            : "border-line hover:border-foreground"
                        } ${isOut ? "line-through opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {v.size}
                        {!isOut && v.stock <= 2 && (
                          <span className="absolute top-1 right-1.5 text-[8px] uppercase tracking-wider text-amber-600">
                            {v.stock}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                )}

                <button
                  onClick={handleCta}
                  disabled={needsColor || !selectedSize || outOfStock}
                  className="mt-5 w-full bg-foreground text-background py-3.5 text-xs uppercase tracking-widest font-medium rounded-md active:scale-[0.98] transition-transform disabled:bg-line disabled:text-muted disabled:cursor-not-allowed"
                >
                  {needsColor
                    ? "Selecione a cor"
                    : !selectedSize
                    ? "Selecione um tamanho"
                    : outOfStock
                    ? "Esgotado"
                    : "Adicionar à sacola"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
