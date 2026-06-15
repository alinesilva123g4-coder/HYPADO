import { CartPage } from "./CartPage";
import { getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: "Sacola · HYPADO",
};

export default async function Page() {
  const settings = await getSiteSettings();
  return (
    <CartPage
      shopOpen={settings.shopOpen}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
