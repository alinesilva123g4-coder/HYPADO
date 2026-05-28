"use client";

import { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Drop limitado · sem reposição",
  "Frete grátis acima de R$ 299",
  "Feito no Nordeste · enviado pra todo o Brasil",
  "Pagamento em até 3x sem juros",
];

export function AnnounceBar() {
  const [idx, setIdx] = useState(0);
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((s) => {
        if (s?.announceMessages?.length) setMessages(s.announceMessages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="bg-foreground text-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-7 md:h-8 flex items-center justify-center text-[9px] md:text-[10px] uppercase tracking-[0.25em] md:tracking-[0.3em] relative">
        {messages.map((m, i) => (
          <span
            key={`${i}-${m}`}
            aria-hidden={i !== idx}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              i === idx
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
