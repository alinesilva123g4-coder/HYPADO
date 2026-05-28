"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Icon = React.FC<{ className?: string }>;

const IconDashboard: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const IconProducts: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7.5 12 3l9 4.5" />
    <path d="M3 7.5v9L12 21l9-4.5v-9" />
    <path d="M12 12 3 7.5M12 12l9-4.5M12 12v9" />
  </svg>
);

const IconOrders: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    <rect x="3.5" y="7" width="17" height="14" rx="2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IconReviews: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3.5 2.6 5.4 6 .8-4.4 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.4-4.1 6-.8L12 3.5Z" />
  </svg>
);

const IconAnalytics: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 20h18" />
    <path d="M6 16v-4M11 16V8M16 16v-6M20 16v-2" />
  </svg>
);

const IconSettings: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

const NAV: { href: string; label: string; Icon: Icon }[] = [
  { href: "/admin", label: "Dashboard", Icon: IconDashboard },
  { href: "/admin/produtos", label: "Produtos", Icon: IconProducts },
  { href: "/admin/pedidos", label: "Pedidos", Icon: IconOrders },
  { href: "/admin/avaliacoes", label: "Avaliações", Icon: IconReviews },
  { href: "/admin/analytics", label: "Analytics", Icon: IconAnalytics },
  { href: "/admin/configuracoes", label: "Configurações", Icon: IconSettings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 bg-white border border-neutral-200 rounded-xl w-10 h-10 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
          {open ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-40 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-neutral-200">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="HYPADO"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ animation: "none" }}
            />
            <div className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-archivo)] tracking-[0.18em] text-sm">
                HYPADO
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.25em] text-neutral-500">
                painel admin
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-neutral-900"
                  />
                )}
                <item.Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 ${
                    active ? "text-white" : "text-neutral-500 group-hover:text-neutral-900"
                  } transition-colors`}
                />
                <span className="font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 pb-5 border-t border-neutral-200 pt-3 space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-400">
              <path d="M14 4h6v6" />
              <path d="M20 4 10 14" />
              <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
            </svg>
            Abrir loja
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-400">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
