"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";

type Order = {
  id: string;
  customerName: string;
  whatsapp: string;
  address: string | null;
  totalCents: number;
  status: string;
  createdAt: string;
  items: { id: string; qty: number; size: string; priceCents: number; productName: string }[];
};

const STATUSES = ["pending", "paid", "shipped", "delivered", "canceled"];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  canceled: "bg-neutral-200 text-neutral-600",
};

export function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(order.status);

  async function update(s: string) {
    setStatus(s);
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Excluir pedido?")) return;
    const r = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  return (
    <li className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{order.customerName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
              {STATUS_LABEL[status] || status}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {new Date(order.createdAt).toLocaleString("pt-BR")}
          </div>
        </button>
        <div className="text-right">
          <div className="font-semibold">{formatBRL(order.totalCents)}</div>
          <div className="text-[11px] text-neutral-500">{open ? "fechar" : "abrir"}</div>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-100 p-4 bg-neutral-50 space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-neutral-500">WhatsApp</div>
              <a
                href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                className="font-medium hover:underline"
              >
                {order.whatsapp}
              </a>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Endereço</div>
              <div>{order.address || "—"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-500 mb-1">Itens</div>
            <ul className="text-sm divide-y divide-neutral-200 bg-white border border-neutral-200 rounded-lg">
              {order.items.map((it) => (
                <li key={it.id} className="px-3 py-2 flex justify-between">
                  <span>
                    {it.qty}× {it.productName} <span className="text-neutral-500">({it.size})</span>
                  </span>
                  <span className="font-medium">{formatBRL(it.priceCents * it.qty)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500">Status:</span>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  status === s ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            <button onClick={remove} className="ml-auto text-xs text-red-600 hover:underline">
              Excluir
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
