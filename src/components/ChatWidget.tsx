"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string };

const STORAGE_KEY = "hypado:chat:v1";
const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "Eai, sou o **Heitor**, atendente aqui da HYPADO. Em que posso te ajudar? Tamanho, frete, troca, recomendação de peça… manda a real.",
};

const SUGGESTIONS = [
  "Qual a diferença entre blusa e camiseta?",
  "Como funciona o frete?",
  "Quero recomendação de short",
  "Posso trocar se não servir?",
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

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
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

  const onPdp = pathname?.startsWith("/produto/");

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label={open ? "Fechar chat" : "Abrir chat com a HYPADO"}
        onClick={() => setOpen((o) => !o)}
        className={`fixed right-5 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 ring-1 ring-emerald-700/20 transition-all duration-300 hover:scale-105 hover:bg-[#1ebe5d] ${
          onPdp ? "bottom-24" : "bottom-5"
        } ${open ? "opacity-0 pointer-events-none scale-90" : "opacity-100"}`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        {unread && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#F5B400] ring-2 ring-background" />
        )}
      </button>

      {/* Panel */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 md:bottom-5 md:right-5 z-50 w-full md:w-[400px] h-[88vh] md:h-[640px] max-h-[760px] flex flex-col bg-background border border-line shadow-2xl shadow-black/20 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:rounded-md overflow-hidden ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-foreground text-background">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-background text-foreground flex items-center justify-center font-black text-base flex-shrink-0">
              H
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium leading-tight">Heitor</div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-background/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Atendente HYPADO · online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={reset}
              aria-label="Limpar conversa"
              className="h-8 w-8 rounded-full hover:bg-background/10 text-background/80 hover:text-background flex items-center justify-center transition-colors"
              title="Limpar conversa"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="h-8 w-8 rounded-full hover:bg-background/10 text-background/80 hover:text-background flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-surface/30"
        >
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role}>
              {renderMessage(m.content || (streaming ? "…" : ""))}
            </Bubble>
          ))}
          {streaming &&
            messages[messages.length - 1]?.content === "" && (
              <Bubble role="assistant">
                <TypingDots />
              </Bubble>
            )}

          {/* Suggestions — só aparece na conversa inicial */}
          {messages.length === 1 && !streaming && (
            <div className="pt-1 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-line hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-line p-3 bg-background"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Manda sua dúvida…"
              disabled={streaming}
              className="input-base text-sm resize-none max-h-32 min-h-10 py-2.5"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={streaming || input.trim().length === 0}
              aria-label="Enviar"
              className="h-10 w-10 rounded-md bg-foreground text-background flex items-center justify-center btn-outline disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-muted text-center">
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
}: {
  role: Role;
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-foreground text-background rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed btn-outline">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black flex-shrink-0">
        H
      </div>
      <div className="max-w-[85%] bg-background border border-line rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-end h-4">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-[bounce_1.2s_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-[bounce_1.2s_infinite] [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-[bounce_1.2s_infinite] [animation-delay:0.3s]" />
    </span>
  );
}
