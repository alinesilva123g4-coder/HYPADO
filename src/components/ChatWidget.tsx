"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/lib/chat";
import { formatBRL } from "@/lib/format";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string };

const STORAGE_KEY = "hypado:chat:v1";
const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "Eai, sou o **Heitor**, atendente aqui da HYPADO. Em que posso te ajudar? Tamanho, frete, troca, recomendação de peça… manda a real.",
};

// Ordenadas do maior pro menor — formam o efeito "escada" alinhado à direita.
const SUGGESTIONS = [
  "Me mostra os produtos em alta",
  "Quero um presente pra alguém",
  "Como funciona frete e troca?",
  "Procuro algo pra mim",
];

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";

/** Renderiza markdown leve: **bold**, links http(s), {WHATSAPP_NUMBER} → link da loja. */
function renderMessage(content: string) {
  const replaced = content.replace(/\{WHATSAPP_NUMBER\}/g, WHATSAPP);
  // Split por links
  const linkRe = /(https?:\/\/[^\s)]+)/g;
  const parts = replaced.split(linkRe);

  return parts.map((part, i) => {
    if (linkRe.test(part)) {
      linkRe.lastIndex = 0;
      const isWa = part.includes("wa.me");
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 ${
            isWa ? "font-medium" : ""
          } hover:text-foreground/80`}
        >
          {isWa ? "Abrir WhatsApp" : part}
        </a>
      );
    }
    // Bold ** **
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      const m = bp.match(/^\*\*([^*]+)\*\*$/);
      if (m) {
        return (
          <strong key={`${i}-${j}`} className="font-semibold">
            {m[1]}
          </strong>
        );
      }
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

// O Heitor anexa os produtos recomendados numa linha [[produtos: slug1, slug2]].
const PRODUCTS_RE = /\[\[\s*produtos?\s*:\s*([^\]]+?)\s*\]\]/i;

function extractSlugs(content: string): string[] {
  const m = content.match(PRODUCTS_RE);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/^\/?produto\//i, "").replace(/\/+$/, ""))
    .filter(Boolean)
    .slice(0, 6);
}

/** Remove a diretiva [[produtos:...]] do texto visível — inclusive enquanto
   ela ainda está chegando no streaming (token incompleto no fim). */
function stripDirective(content: string): string {
  return content
    .replace(PRODUCTS_RE, "")
    .replace(/\[\[\s*produtos?\s*:?[^\]]*$/i, "")
    .replace(/\[\[\s*$/i, "")
    .trimEnd();
}

type ChatProduct = {
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  image: string | null;
};

const productCache = new Map<string, ChatProduct>();

function ChatProducts({
  slugs,
  onNavigate,
}: {
  slugs: string[];
  onNavigate: () => void;
}) {
  const key = slugs.join(",");
  const [products, setProducts] = useState<ChatProduct[] | null>(null);

  // ---- Arrastar pra rolar (desktop). No toque o scroll já é nativo. ----
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isDown = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const moved = useRef(0); // distância arrastada — separa clique de arrasto
  const lastX = useRef(0); // posição no último frame — base da velocidade
  const lastT = useRef(0); // timestamp do último frame
  const velocity = useRef(0); // px/ms (sinal = direção)
  const dragRaf = useRef<number | null>(null); // arraste em sync com o frame
  const glideRaf = useRef<number | null>(null); // inércia pós-soltar

  function onPointerDown(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    isDown.current = true;
    moved.current = 0;
    velocity.current = 0;
    setDragging(true);
    startX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    lastX.current = e.clientX;
    lastT.current = performance.now();
    if (glideRaf.current != null) cancelAnimationFrame(glideRaf.current);
    el.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || !isDown.current) return;
    const x = e.clientX;
    moved.current = Math.max(moved.current, Math.abs(x - startX.current));
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) {
      const v = (x - lastX.current) / dt;
      velocity.current = velocity.current * 0.7 + v * 0.3; // suaviza ruído
    }
    lastX.current = x;
    lastT.current = now;
    // Aplica o scroll dentro do rAF → 1 atualização por frame, sem engasgo.
    if (dragRaf.current == null) {
      dragRaf.current = requestAnimationFrame(() => {
        dragRaf.current = null;
        el.scrollLeft = startScroll.current - (lastX.current - startX.current);
      });
    }
  }
  function endPointer(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!isDown.current) return;
    isDown.current = false;
    setDragging(false);
    if (dragRaf.current != null) {
      cancelAnimationFrame(dragRaf.current);
      dragRaf.current = null;
    }
    el?.releasePointerCapture?.(e.pointerId);
    if (!el) return;
    // Inércia estilo iOS: baseada em TEMPO, não em frames. A velocidade decai
    // exponencialmente pela constante de desaceleração do UIScrollView
    // (~0.998/ms), então o glide é longo, contínuo e igual em 60 ou 120fps.
    let v = velocity.current; // px/ms (sinal = direção)
    if (Math.abs(v) < 0.05) return; // gesto parado: deixa o snap cuidar
    const DECEL = 0.998; // atrito por ms — quanto maior, mais longo o deslize
    let last = performance.now();
    const glide = (now: number) => {
      const dt = now - last;
      last = now;
      el.scrollLeft -= v * dt; // desloca por velocidade × tempo
      v *= Math.pow(DECEL, dt); // decaimento contínuo no tempo
      if (Math.abs(v) > 0.02) {
        glideRaf.current = requestAnimationFrame(glide);
      } else {
        glideRaf.current = null;
      }
    };
    glideRaf.current = requestAnimationFrame(glide);
  }
  // Limpa frames pendentes ao desmontar.
  useEffect(
    () => () => {
      if (dragRaf.current != null) cancelAnimationFrame(dragRaf.current);
      if (glideRaf.current != null) cancelAnimationFrame(glideRaf.current);
    },
    []
  );

  // Bloqueia a navegação do <Link> quando o gesto foi um arrasto, não um clique.
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  useEffect(() => {
    let alive = true;
    const cached = slugs.map((s) => productCache.get(s)).filter(Boolean) as ChatProduct[];
    if (cached.length === slugs.length) {
      setProducts(cached);
      return;
    }
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products?: ChatProduct[] }) => {
        if (!alive) return;
        const list = d.products ?? [];
        list.forEach((p) => productCache.set(p.slug, p));
        setProducts(list);
      })
      .catch(() => {
        if (alive) setProducts([]);
      });
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (products === null) {
    return (
      <div className="mt-2 ml-8 flex gap-2.5">
        {slugs.slice(0, 3).map((s) => (
          <div key={s} className="w-[140px] shrink-0">
            <div className="aspect-[4/5] w-full rounded-xl skeleton" />
            <div className="mt-2 h-3 w-3/4 skeleton" />
            <div className="mt-1.5 h-3 w-1/3 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={onClickCapture}
      className={`mt-2 ml-8 flex gap-2.5 overflow-x-auto pb-1.5 snap-x snap-proximity select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ touchAction: "pan-x pan-y", overscrollBehaviorX: "contain" }}
    >
      {products.map((p) => (
        <Link
          key={p.slug}
          href={`/produto/${p.slug}`}
          onClick={onNavigate}
          draggable={false}
          className="group snap-start shrink-0 w-[140px] active:scale-[0.97] transition-transform"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface ring-1 ring-black/[0.06]">
            {p.image ? (
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="140px"
                draggable={false}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04] pointer-events-none select-none"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-foreground/30">
                sem foto
              </div>
            )}
          </div>
          <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-foreground/45">
            {p.category}
          </div>
          <div className="text-[12px] font-medium leading-tight line-clamp-2 text-foreground">
            {p.name}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">
            {formatBRL(p.priceCents)}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const { open, setOpen, unread, setUnread } = useChat();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Autoscroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Focus on open
  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Trava o scroll/interação da página enquanto o chat está aberto —
  // o usuário não interage com o conteúdo de trás, só com o assistente.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  async function send(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = genId();
    const placeholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setInput("");
    setStreaming(true);

    try {
      const payload = [...messages, userMsg]
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const fallback =
          data.error === "missing_api_key"
            ? `Tô fora do ar agora, mas vou te jogar direto pra galera no WhatsApp. https://wa.me/${WHATSAPP}`
            : "Não consegui responder agora. Tenta de novo em alguns segundos, ou fala direto no WhatsApp: https://wa.me/" +
              WHATSAPP;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fallback } : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
      if (!open) setUnread(true);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Algo deu errado. Tenta de novo, ou chama direto no WhatsApp: https://wa.me/" +
                  WHATSAPP,
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    setMessages([GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Backdrop — escurece o conteúdo atrás do painel (feel de app) */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel — iOS sheet style */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 md:bottom-5 md:right-5 z-50 w-full md:w-[400px] h-[88vh] md:h-[680px] max-h-[820px] flex flex-col bg-white/85 backdrop-blur-2xl backdrop-saturate-150 border border-black/5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35),0_8px_24px_-8px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.34,1.36,0.64,1)] rounded-t-[28px] md:rounded-[28px] overflow-hidden ${
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-8 scale-[0.96] pointer-events-none"
        }`}
        style={{
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        }}
      >
        {/* Grab handle (mobile sheet feel) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <span className="h-1 w-9 rounded-full bg-black/20" />
        </div>

        {/* Header — frosted glass with avatar */}
        <div className="relative flex items-center justify-between gap-3 px-4 pt-3 pb-3 border-b border-black/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-11 w-11 rounded-full bg-white ring-1 ring-black/10 flex items-center justify-center overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
                <Image
                  src="/brand/hypado-mark.png"
                  alt="HYPADO"
                  width={44}
                  height={44}
                  className="h-8 w-8 object-contain"
                />
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight text-foreground tracking-tight">Heitor</div>
              <div className="text-[11px] text-foreground/55 leading-tight mt-0.5">
                Atendente HYPADO · ativo agora
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={reset}
              aria-label="Limpar conversa"
              className="h-9 w-9 rounded-full bg-black/5 hover:bg-black/10 text-foreground/70 hover:text-foreground flex items-center justify-center transition-all active:scale-90"
              title="Limpar conversa"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="h-9 w-9 rounded-full bg-black/5 hover:bg-black/10 text-foreground/70 hover:text-foreground flex items-center justify-center transition-all active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2"
        >
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const grouped = prev?.role === m.role;
            const slugs = m.role === "assistant" ? extractSlugs(m.content) : [];
            const text =
              m.role === "assistant" ? stripDirective(m.content) : m.content;
            const showBubble =
              !!text || (streaming && i === messages.length - 1) || slugs.length === 0;
            return (
              <div key={m.id}>
                {showBubble && (
                  <Bubble role={m.role} grouped={grouped}>
                    {renderMessage(text || (streaming ? "…" : ""))}
                  </Bubble>
                )}
                {slugs.length > 0 && (
                  <ChatProducts slugs={slugs} onNavigate={() => setOpen(false)} />
                )}
              </div>
            );
          })}
          {streaming &&
            messages[messages.length - 1]?.content === "" && (
              <Bubble role="assistant" grouped={false}>
                <TypingDots />
              </Bubble>
            )}

          {/* Suggestions — pílulas sólidas empilhadas, alinhadas à direita */}
          {messages.length === 1 && !streaming && (
            <div className="pt-3 flex flex-col items-end gap-2.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="rise max-w-full whitespace-nowrap text-[13px] leading-snug font-medium px-4 py-2.5 rounded-[22px] bg-foreground text-background shadow-[0_3px_10px_-2px_rgba(0,0,0,0.25)] hover:opacity-90 active:scale-95 transition-[opacity,transform] duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input — iOS pill */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="px-3 pt-2 pb-3 md:pb-3 bg-white/40 backdrop-blur-xl border-t border-black/5"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 flex items-end rounded-[22px] bg-white border border-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-foreground/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Mensagem"
                disabled={streaming}
                className="flex-1 bg-transparent text-[14px] resize-none max-h-32 min-h-[40px] px-4 py-2.5 outline-none placeholder:text-foreground/40 text-foreground"
                style={{ fieldSizing: "content" } as React.CSSProperties}
                maxLength={1000}
              />
            </div>
            <button
              type="submit"
              disabled={streaming || input.trim().length === 0}
              aria-label="Enviar"
              className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-90 enabled:hover:scale-105"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-[10px] text-foreground/40 text-center">
            Atendimento humano via WhatsApp · seg–sáb 9h–19h
          </div>
        </form>
      </div>
    </>
  );
}

function Bubble({
  role,
  children,
  grouped,
}: {
  role: Role;
  children: React.ReactNode;
  grouped: boolean;
}) {
  if (role === "user") {
    return (
      <div className={`flex justify-end ${grouped ? "mt-0.5" : "mt-2"}`}>
        <div
          className={`max-w-[78%] bg-foreground text-background px-3.5 py-2 text-[14px] leading-snug shadow-[0_1px_2px_rgba(0,0,0,0.12)] ${
            grouped
              ? "rounded-[20px] rounded-br-[6px]"
              : "rounded-[20px] rounded-br-[6px]"
          }`}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-end gap-1.5 ${grouped ? "mt-0.5" : "mt-2"}`}>
      <div className="w-7 flex-shrink-0">
        {!grouped && (
          <div className="h-7 w-7 rounded-full bg-white ring-1 ring-black/10 flex items-center justify-center overflow-hidden shadow-sm">
            <Image
              src="/brand/hypado-mark.png"
              alt="HYPADO"
              width={28}
              height={28}
              className="h-5 w-5 object-contain"
            />
          </div>
        )}
      </div>
      <div
        className={`max-w-[78%] bg-white text-foreground px-3.5 py-2 text-[14px] leading-snug shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-black/[0.04] ${
          grouped
            ? "rounded-[20px] rounded-bl-[6px]"
            : "rounded-[20px] rounded-bl-[6px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-end h-4 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-[bounce_1.2s_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-[bounce_1.2s_infinite] [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-[bounce_1.2s_infinite] [animation-delay:0.3s]" />
    </span>
  );
}
