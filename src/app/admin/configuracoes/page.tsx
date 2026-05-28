import { getSiteSettings } from "@/lib/settings";
import { SettingsForm } from "./_components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const s = await getSiteSettings();
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-1">Controles globais da loja.</p>
      </header>
      <SettingsForm initial={s} />
    </div>
  );
}
