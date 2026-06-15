"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = {
  /** Nome da tabela no Postgres (ex.: "Order", "Review"). */
  table: string;
  /** Texto opcional do toast quando chega um INSERT novo. */
  insertLabel?: string;
};

/**
 * Assina mudanças (INSERT/UPDATE/DELETE) de uma tabela via Supabase Realtime e
 * chama router.refresh() pra re-renderizar o Server Component pai com os dados
 * atualizados — sem o admin precisar dar F5.
 *
 * Requisitos no banco (ver prisma/realtime-setup.sql):
 *  - tabela adicionada à publication `supabase_realtime`
 *  - RLS habilitada com policy de SELECT pro role `authenticated`
 *
 * Falha graciosamente: se Realtime não estiver configurado, nada quebra —
 * o admin continua funcionando com refresh manual.
 */
export function RealtimeRefresh({ table, insertLabel }: Props) {
  const router = useRouter();
  // Debounce: vários eventos em sequência viram um único refresh.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    const channel = supabase
      .channel(`admin:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          if (payload.eventType === "INSERT" && insertLabel) {
            // Notificação leve via Notification API do navegador, se permitida.
            try {
              if (
                typeof Notification !== "undefined" &&
                Notification.permission === "granted"
              ) {
                new Notification(insertLabel);
              }
            } catch {
              /* ignore */
            }
          }
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [table, insertLabel, router]);

  return null;
}
