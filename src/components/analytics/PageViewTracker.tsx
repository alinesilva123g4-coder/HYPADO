"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * Dispara um evento `page_view` (first-party, gravado na tabela Event) a cada
 * navegação. Alimenta o dashboard de analytics: visitantes únicos, page views,
 * tráfego diário e páginas mais vistas.
 *
 * Ignora rotas /admin — métricas são só de visitantes da loja, não do dono.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    track("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
