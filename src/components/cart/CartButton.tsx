"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { count, hydrated } = useCart();
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (!hydrated) {
      prevCount.current = count;
      return;
    }
    if (count > prevCount.current) {
      setPop(true);
      const t = window.setTimeout(() => setPop(false), 450);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, hydrated]);

  return (
    <Link
      href="/carrinho"
      aria-label={`Sacola${hydrated && count > 0 ? ` com ${count} ${count === 1 ? "item" : "itens"}` : ""}`}
      className="group relative h-10 w-10 -mr-2 flex items-center justify-center active:scale-90 transition-transform"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:-translate-y-0.5"
      >
        <path d="M8 8.5V7a4 4 0 0 1 8 0v1.5" />
        <path d="M4.6 8.5h14.8a.6.6 0 0 1 .6.66l-1.13 10.5A2 2 0 0 1 16.88 21.4H7.12a2 2 0 0 1-1.99-1.74L4 9.16a.6.6 0 0 1 .6-.66Z" />
        <circle cx="9" cy="12" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="0.5" fill="currentColor" stroke="none" />
      </svg>
      {hydrated && count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-medium leading-none flex items-center justify-center tabular-nums"
          style={pop ? { animation: "hp-cart-pop 450ms cubic-bezier(.34,1.6,.64,1)" } : undefined}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
