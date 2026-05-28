"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    setMsg(r.ok ? "Salvo ✓" : "Erro ao salvar");
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Section title="Operação">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={s.shopOpen}
            onChange={(e) => update("shopOpen", e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Loja aberta para vendas</span>
            <span className="block text-xs text-neutral-500">
              Quando desmarcado, novos pedidos via WhatsApp ficam desabilitados.
            </span>
          </span>
        </label>
      </Section>

      <Section title="Faixa de anúncios (topo)">
        <p className="text-xs text-neutral-500 mb-2">Uma mensagem por linha. Rotaciona a cada 4s.</p>
        <textarea
          value={s.announceMessages.join("\n")}
          onChange={(e) =>
            update(
              "announceMessages",
              e.target.value.split("\n").map((x) => x.trim()).filter(Boolean)
            )
          }
          rows={6}
          className="w-full border border-neutral-300 rounded-lg p-3 text-sm font-mono"
        />
      </Section>

      <Section title="Contato">
        <Grid>
          <Field label="WhatsApp (só números, com DDI)">
            <input
              value={s.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value.replace(/\D/g, ""))}
              className="input"
              placeholder="558881623640"
            />
          </Field>
          <Field label="Instagram (sem @)">
            <input
              value={s.instagram}
              onChange={(e) => update("instagram", e.target.value.replace(/^@/, ""))}
              className="input"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Frete">
        <Grid>
          <Field label="Frete grátis a partir de (R$)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={(s.freeShippingFromCents / 100).toFixed(2)}
              onChange={(e) =>
                update("freeShippingFromCents", Math.round(parseFloat(e.target.value || "0") * 100))
              }
              className="input"
            />
          </Field>
          <Field label="Frete padrão (R$)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={(s.flatShippingCents / 100).toFixed(2)}
              onChange={(e) =>
                update("flatShippingCents", Math.round(parseFloat(e.target.value || "0") * 100))
              }
              className="input"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Home — destaque (opcional)">
        <Field label="Título (sobrescreve o default)">
          <input
            value={s.heroHeadline}
            onChange={(e) => update("heroHeadline", e.target.value)}
            className="input"
            placeholder="(usar default)"
          />
        </Field>
        <Field label="Subtítulo">
          <input
            value={s.heroSubline}
            onChange={(e) => update("heroSubline", e.target.value)}
            className="input"
            placeholder="(usar default)"
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid rgb(212 212 216);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
        :global(.input:focus) {
          outline: none;
          border-color: black;
        }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-neutral-200 rounded-2xl p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
