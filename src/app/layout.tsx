import type { Metadata, Viewport } from "next";
import { Inter, Archivo, Pirata_One, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart";
import { ChatProvider } from "@/lib/chat";
import { ToastProvider } from "@/lib/feedback";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ChatWidget } from "@/components/ChatWidget";
import { InitialLoader } from "@/components/layout/InitialLoader";
import { NewsletterPopup } from "@/components/marketing/NewsletterPopup";
import { Analytics } from "@/components/analytics/Analytics";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const pirata = Pirata_One({
  variable: "--font-pirata",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Streetwear Nordestino`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    url: SITE_URL,
    title: `${SITE_NAME} · Streetwear Nordestino`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Streetwear Nordestino`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${archivo.variable} ${pirata.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Detector de baixa potência (pré-pintura): marca .lp no <html> em
            aparelhos fracos, redes lentas ou Economia de Dados. O CSS usa essa
            classe pra desligar os efeitos caros que rodam o tempo todo. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var n=navigator,c=n.connection,lp=false;" +
              "if(c&&(c.saveData||/(^|\\b)(slow-2g|2g|3g)$/.test(c.effectiveType||'')))lp=true;" +
              "if(typeof n.deviceMemory==='number'&&n.deviceMemory<=4)lp=true;" +
              "if(typeof n.hardwareConcurrency==='number'&&n.hardwareConcurrency<=4)lp=true;" +
              "if(lp)document.documentElement.classList.add('lp');}catch(e){}})();",
          }}
        />
        <Analytics />
        <PageViewTracker />
        <InitialLoader />
        <CartProvider>
          <ChatProvider>
            <ToastProvider>
              <RouteProgress />
              <ScrollToTop />
              <Header />
              <main className="flex-1 min-h-screen">{children}</main>
              <Footer />
              <BottomNav />
              <ChatWidget />
              <NewsletterPopup />
              <CookieConsent />
            </ToastProvider>
          </ChatProvider>
        </CartProvider>
      </body>
    </html>
  );
}
