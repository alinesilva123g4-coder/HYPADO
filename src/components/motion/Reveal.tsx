"use client";

import { useEffect, useRef } from "react";

/* Observer único compartilhado por toda a página — em vez de um por elemento.
   Mais leve: um só callback de scroll/intersecção pro browser gerenciar. */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          callbacks.get(entry.target)?.();
          observer!.unobserve(entry.target);
          callbacks.delete(entry.target);
        }
      },
      // dispara um pouco antes do elemento estar 100% na tela
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
  }
  return observer;
}

type Props = {
  children: React.ReactNode;
  /** atraso em ms — usado pra cascata em grids */
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = getObserver();
    // sem suporte a IO (ou SSR sem JS): mostra direto, nada de conteúdo escondido
    if (!obs) {
      el.classList.add("is-visible");
      return;
    }

    callbacks.set(el, () => el.classList.add("is-visible"));
    obs.observe(el);

    return () => {
      obs.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`hp-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
