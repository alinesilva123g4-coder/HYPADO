"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (readConsent() === null) setShow(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  function decide(v: "granted" | "denied") {
    writeConsent(v);
    setShow(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-3 left-3 right-3 md:left-6 md:right-auto md:max-w-md z-[90] border border-line bg-background text-foreground shadow-lg rounded-md p-4 md:p-5"
    >
      <p className="text-[11px] md:text-xs leading-relaxed">
        Usamos cookies para medir audiência, melhorar sua experiência e personalizar
        anúncios. Os cookies essenciais são sempre ativos; os de análise e marketing só
        com o seu consentimento. Você pode aceitar ou recusar. Saiba mais na nossa{" "}
        <Link href="/privacidade" className="underline">
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => decide("granted")}
          className="flex-1 bg-foreground text-background text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-md hover:bg-foreground/90"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          className="flex-1 border border-line text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-md hover:bg-surface"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
