"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatBRL } from "@/lib/format";
import { haptic } from "@/lib/feedback";
import { track } from "@/lib/track";
import { trackInitiateCheckout, trackContact } from "@/lib/analytics";

type Props = {
  count: number;
  subtotalCents: number;
  totalCents: number;
  waLink: string;
  messagePreview: string;
};

/**
 * Transição sem atrito carrinho → WhatsApp.
 * Um clique abre a folha de confirmação (recap + prévia da mensagem =
 * transparência/segurança). O toque no botão verde abre o WhatsApp na hora,
 * direto do gesto do usuário — sem risco de bloqueio de popup.
 */
export function CheckoutSheet({
  count,
  subtotalCents,
  totalCents,
  waLink,
  messagePreview,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [handing, setHanding] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openSheet() {
    haptic(8);
    setHanding(false);
    setOpen(true);
    track("checkout_started", {
      meta: { count, subtotalCents, totalCents },
    });
  }

  function handoff() {
    // Gesto direto do usuário → abre o WhatsApp imediatamente (sem bloqueio).
    haptic([8, 30, 14]);
    setHanding(true);
    trackInitiateCheckout({
      ids: [],
      value: totalCents / 100,
      num_items: count,
    });
    trackContact("whatsapp");
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        onClick={openSheet}
        className="btn-trace mt-5 md:mt-6 block w-full bg-foreground text-background py-3.5 md:py-4 text-center text-xs md:text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors rounded-md"
      >
        Finalizar pedido
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <LockIcon className="h-3 w-3" />
        Sem pagamento no site. Você confirma tudo no WhatsApp.
      </p>

      {mounted &&
        createPortal(
          <div
            aria-hidden={!open}
            className={`fixed inset-0 z-[120] transition-opacity duration-300 ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar pedido"
          >
            <div
              className="absolute inset-0 bg-ink/55"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit md:max-w-md bg-background rounded-t-2xl md:rounded-2xl shadow-2xl"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
                animation: open
                  ? "hp-sheet-in 360ms cubic-bezier(.22,1,.36,1) both"
                  : undefined,
              }}
            >
              {/* Handle (mobile) */}
              <div className="flex justify-center pt-2.5 pb-1 md:hidden">
                <span className="h-1 w-10 rounded-full bg-line" />
              </div>

              <div className="px-5 md:px-7 pt-3 md:pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow text-[9px] md:text-[10px]">Quase lá</div>
                    <h3 className="mt-1.5 text-lg md:text-xl font-medium">
                      Confirmar pedido
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    className="-mr-1.5 -mt-1 h-9 w-9 flex items-center justify-center text-foreground/55 active:scale-90 transition-transform"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Recap */}
                <dl className="mt-4 rounded-md border border-line bg-surface/60 px-4 py-3.5 space-y-2 text-[13px] md:text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">{count} {count === 1 ? "item" : "itens"}</dt>
                    <dd className="tabular-nums">{formatBRL(subtotalCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Frete</dt>
                    <dd className="tabular-nums text-foreground/70">a combinar</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-[15px] md:text-base">
                    <dt className="font-medium">Total</dt>
                    <dd className="tabular-nums font-medium">{formatBRL(totalCents)}</dd>
                  </div>
                </dl>

                {/* Prévia da mensagem — transparência = segurança */}
                <div className="mt-3.5">
                  <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted">
                    Mensagem que vai ser enviada
                  </div>
                  <pre className="max-h-28 overflow-y-auto rounded-md border border-line bg-background px-3.5 py-3 text-[12px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans">
{messagePreview}
                  </pre>
                </div>

                {/* Handoff */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handoff}
                  className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-md bg-[#25D366] py-3.5 md:py-4 text-xs md:text-sm uppercase tracking-widest text-white active:scale-[0.98] transition-transform hover:bg-[#1FB755]"
                >
                  {handing ? (
                    <>
                      <Spinner />
                      Abrindo o WhatsApp…
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="h-4 w-4" />
                      Abrir WhatsApp e enviar
                    </>
                  )}
                </a>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted leading-relaxed text-center">
                  <LockIcon className="h-3 w-3 flex-none" />
                  Resposta na hora. Combinamos pagamento e envio por lá.
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.1 2.9c.1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5a9.5 9.5 0 0 1-4.8-1.3l-.3-.2-3.6.9 1-3.5-.2-.4A9.5 9.5 0 1 1 12 21.5m0-21A11.5 11.5 0 0 0 2.1 17.9L.5 23.5l5.7-1.5A11.5 11.5 0 1 0 12 .5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
