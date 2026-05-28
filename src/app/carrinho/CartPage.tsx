"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { haptic } from "@/lib/feedback";
import { CheckoutSheet } from "./CheckoutSheet";

export function CartPage() {
  const { items, count, subtotalCents, setQty, remove, clear, hydrated } = useCart();

  const shipping = subtotalCents >= 29900 ? 0 : subtotalCents > 0 ? 2490 : 0;
  const total = subtotalCents + shipping;

  const waMessage = buildWhatsappMessage(items, subtotalCents, shipping, total);
  const waLink = whatsappLink(waMessage);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 pb-4 md:pb-6">
        <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-muted">HYPADO</div>
        <h1 className="mt-2 md:mt-3 text-2xl md:text-5xl font-medium tracking-tight">Sua sacola</h1>
        {hydrated && count > 0 && (
          <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-muted">
            {count} {count === 1 ? "item" : "itens"} · Subtotal {formatBRL(subtotalCents)}
          </p>
        )}
      </div>

      {!hydrated ? (
        <div className="mx-auto max-w-7xl px-6 pb-24">
          <div className="h-40 border border-line animate-pulse bg-surface" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="mx-auto max-w-7xl px-4 md:px-6 pb-14 md:pb-24 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-10 lg:gap-16">
          {/* Items */}
          <div>
            <div className="border-t border-line">
              {items.map((item) => (
                <CartRow
                  key={`${item.productId}-${item.size}`}
                  item={item}
                  onInc={() => {
                    haptic(6);
                    setQty(item.productId, item.size, item.qty + 1);
                  }}
                  onDec={() => {
                    haptic(6);
                    setQty(item.productId, item.size, item.qty - 1);
                  }}
                  onRemove={() => {
                    haptic([8, 30, 14]);
                    remove(item.productId, item.size);
                  }}
                />
              ))}
            </div>
            <div className="mt-4 md:mt-6 flex items-center justify-between text-[11px] md:text-xs">
              <Link
                href="/"
                className="uppercase tracking-widest text-muted hover:text-foreground"
              >
                ← Continuar comprando
              </Link>
              <button
                onClick={clear}
                className="uppercase tracking-widest text-muted hover:text-foreground underline underline-offset-4"
              >
                Esvaziar sacola
              </button>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="border border-line p-5 md:p-7 bg-surface rounded-md">
              <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-muted">Resumo</div>
              <h2 className="mt-1.5 md:mt-2 text-lg md:text-xl font-medium">Total do pedido</h2>

              <dl className="mt-4 md:mt-6 space-y-2.5 md:space-y-3 text-[13px] md:text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatBRL(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Frete</dt>
                  <dd className="tabular-nums">
                    {shipping === 0 ? (
                      <span className="text-emerald-600">Grátis</span>
                    ) : (
                      formatBRL(shipping)
                    )}
                  </dd>
                </div>
                {shipping > 0 && (
                  <div className="text-[11px] text-muted">
                    Faltam {formatBRL(29900 - subtotalCents)} para frete grátis
                  </div>
                )}
                <div className="border-t border-line pt-3 flex justify-between text-base">
                  <dt className="font-medium">Total</dt>
                  <dd className="tabular-nums font-medium">{formatBRL(total)}</dd>
                </div>
                <div className="text-[11px] text-muted">
                  ou 3x de {formatBRL(total / 3)} sem juros
                </div>
              </dl>

              <CheckoutSheet
                count={count}
                subtotalCents={subtotalCents}
                shippingCents={shipping}
                totalCents={total}
                waLink={waLink}
                messagePreview={waMessage}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <Badge title="Envio" sub="Todo Brasil" />
              <Badge title="Trocas" sub="7 dias" />
              <Badge title="Pago" sub="Em até 3x" />
            </div>
          </aside>
        </section>
      )}
    </>
  );
}

function CartRow({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const line = item.priceCents * item.qty;
  return (
    <div className="grid grid-cols-[80px_1fr_auto] md:grid-cols-[120px_1fr_auto] gap-3 md:gap-6 py-4 md:py-6 border-b border-line">
      <Link
        href={`/produto/${item.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden bg-surface rounded-md"
      >
        {item.image && (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="120px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex flex-col min-w-0">
        <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-muted">
          {item.category}
        </div>
        <Link
          href={`/produto/${item.slug}`}
          className="mt-0.5 md:mt-1 text-sm md:text-lg font-medium leading-tight hover:underline underline-offset-4 line-clamp-2"
        >
          {item.name}
        </Link>
        <div className="mt-0.5 md:mt-1 text-[11px] md:text-xs text-muted">Tam · {item.size}</div>

        <div className="mt-auto pt-2 md:pt-3 flex items-center gap-3 md:gap-4">
          <div className="inline-flex items-center border border-line rounded-md">
            <button
              onClick={onDec}
              aria-label="Diminuir quantidade"
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-surface"
            >
              −
            </button>
            <span className="w-7 md:w-8 text-center text-xs md:text-sm tabular-nums">{item.qty}</span>
            <button
              onClick={onInc}
              aria-label="Aumentar quantidade"
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-surface"
            >
              +
            </button>
          </div>
          <button
            onClick={onRemove}
            className="text-[11px] md:text-xs text-muted hover:text-foreground underline underline-offset-4"
          >
            Remover
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <div className="text-sm md:text-lg font-medium tabular-nums whitespace-nowrap">
          {formatBRL(line)}
        </div>
        {item.qty > 1 && (
          <div className="text-[10px] md:text-[11px] text-muted tabular-nums whitespace-nowrap">
            {formatBRL(item.priceCents)} cada
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 pb-14 md:pb-24">
      <div className="border border-line p-8 md:p-20 text-center bg-surface rounded-md">
        <div className="mx-auto w-14 h-14 rounded-full border border-line flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-7 h-7 text-foreground/60"
          >
            <path d="M4 7h16l-1.4 12.1a2 2 0 0 1-2 1.9H7.4a2 2 0 0 1-2-1.9L4 7Z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          </svg>
        </div>
        <h2 className="mt-5 md:mt-6 text-xl md:text-3xl font-medium tracking-tight">
          Sua sacola está vazia.
        </h2>
        <p className="mt-2.5 md:mt-3 text-xs md:text-sm text-muted max-w-sm mx-auto">
          Dá uma olhada na coleção. Drop limitado, sem reposição.
        </p>
        <div className="mt-6 md:mt-8 flex flex-wrap gap-2.5 md:gap-3 justify-center">
          <Link
            href="/categoria/Camisetas"
            className="btn-trace bg-foreground text-background px-5 md:px-6 py-3 text-[11px] md:text-xs uppercase tracking-widest hover:bg-foreground/90 rounded-md"
          >
            Ver Camisetas
          </Link>
          <Link
            href="/"
            className="btn-trace border border-foreground px-5 md:px-6 py-3 text-[11px] md:text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-md"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </section>
  );
}

function Badge({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border border-line py-3 px-2">
      <div className="text-[10px] uppercase tracking-widest text-muted">{title}</div>
      <div className="mt-1 text-[11px]">{sub}</div>
    </div>
  );
}

function buildWhatsappMessage(
  items: CartItem[],
  subtotalCents: number,
  shippingCents: number,
  totalCents: number,
) {
  if (items.length === 0) return "Olá, HYPADO! Quero comprar.";
  const lines = items
    .map(
      (i) =>
        `• ${i.name} (${i.size}) × ${i.qty} · ${formatBRL(i.priceCents * i.qty)}`,
    )
    .join("\n");
  const frete = shippingCents === 0 ? "Grátis" : formatBRL(shippingCents);
  return (
    `Olá, HYPADO! Quero finalizar meu pedido:\n\n` +
    `${lines}\n\n` +
    `Subtotal: ${formatBRL(subtotalCents)}\n` +
    `Frete: ${frete}\n` +
    `*Total: ${formatBRL(totalCents)}*\n\n` +
    `Pode confirmar pagamento e envio?`
  );
}
