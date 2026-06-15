"use client";

import { useEffect, useState, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { track } from "@/lib/track";
import { trackLead } from "@/lib/analytics";

const STORAGE_KEY = "hypado:newsletter-popup:v1";
const DELAY_MS = 12000;
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 dias

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function NewsletterPopup() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname?.startsWith("/admin")) return;
    if (pathname?.startsWith("/checkout")) return;

    try {
      const flag = localStorage.getItem(STORAGE_KEY);
      if (flag) {
        const parsed = JSON.parse(flag) as {
          dismissed?: number;
          subscribed?: number;
        };
        // Cadastro feito: nunca mais mostra.
        if (parsed.subscribed) return;
        // Fechou sem cadastrar: só reaparece depois de DISMISS_TTL_MS.
        if (parsed.dismissed && Date.now() - parsed.dismissed < DISMISS_TTL_MS) {
          return;
        }
      }
    } catch {}

    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [mounted, pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstFieldRef.current?.focus(), 350);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: Date.now() }));
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Preencha seu nome e um telefone válido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          birthdate: birthdate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Falha ao enviar.");
      }
      setSuccess(true);
      track("lead_captured", {
        meta: { source: "newsletter_popup", hasBirthdate: !!birthdate },
      });
      {
        const d = phone.replace(/\D/g, "");
        const withDdi = d.startsWith("55") ? d : `55${d}`;
        trackLead("newsletter_popup", { phone: withDdi });
      }
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ subscribed: Date.now() })
        );
      } catch {}
      setTimeout(() => setOpen(false), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[120] flex items-center justify-center p-4 transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/55 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-newsletter-title"
        className={`relative w-full max-w-[380px] bg-background border border-foreground/15 rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 opacity-0 scale-95"
        }`}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Fechar"
          onClick={dismiss}
          className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <span className="relative block h-4 w-4">
            <span className="absolute inset-x-0 top-1/2 h-[1.5px] bg-current rotate-45" />
            <span className="absolute inset-x-0 top-1/2 h-[1.5px] bg-current -rotate-45" />
          </span>
        </button>

        {success ? (
          <div className="px-7 py-10 text-center">
            <Image
              src="/brand/logo.png"
              alt="HYPADO"
              width={160}
              height={160}
              className="mx-auto h-12 w-auto object-contain mb-5"
            />
            <div className="mx-auto h-14 w-14 rounded-full border border-foreground flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="gothic text-3xl mt-5">Tá na lista.</h3>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              Tá em casa. Te avisamos no próximo drop.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-7 pt-7 pb-4 border-b border-line text-center">
              <Image
                src="/brand/logo.png"
                alt="HYPADO"
                width={160}
                height={160}
                priority
                className="mx-auto h-10 w-auto object-contain mb-4"
              />
              <div className="text-[10px] uppercase tracking-[0.4em] text-foreground/55">
                Acesso antecipado
              </div>
              <h2
                id="hp-newsletter-title"
                className="gothic text-3xl leading-[0.95] mt-2.5"
              >
                Entra na lista,
                <br />
                veste primeiro.
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground/70 max-w-[300px] mx-auto">
                Cada drop é limitado e sem reposição. Quem tá na lista é avisado
                antes — e veste antes de esgotar.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-7 py-5 space-y-3">
              <Field
                ref={firstFieldRef}
                label="Nome"
                value={name}
                onChange={(v) => setName(v)}
                placeholder="Como te chamamos"
                autoComplete="given-name"
              />
              <Field
                label="WhatsApp"
                value={phone}
                onChange={(v) => setPhone(maskPhone(v))}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
              <Field
                label="Data de nascimento"
                value={birthdate}
                onChange={setBirthdate}
                type="date"
                hint="Pra te mandar presente no seu dia."

              />

              {error && (
                <div className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-trace btn-outline w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-xs uppercase tracking-widest rounded-md hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Enviando…" : "Quero entrar"}
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="btn-trace w-full inline-flex items-center justify-center gap-2 border border-foreground text-foreground px-6 py-3 text-xs uppercase tracking-widest rounded-md hover:bg-foreground hover:text-background transition-colors"
              >
                Agora não
              </button>

              <p className="text-[10px] text-center text-foreground/45 leading-relaxed pt-2">
                Sem spam. Cancela quando quiser.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  hint?: string;
};

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, value, onChange, placeholder, type = "text", inputMode, autoComplete, hint },
  ref
) {
  return (
    <label className="block text-center">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-foreground/60 mb-1.5">
        {label}
      </span>
      <input
        ref={ref}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 bg-background border border-line focus:border-foreground outline-none text-sm text-center transition-colors placeholder:text-foreground/30"
      />
      {hint && (
        <span className="block text-[10px] text-foreground/45 mt-1">{hint}</span>
      )}
    </label>
  );
});
