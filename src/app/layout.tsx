import type { Metadata } from "next";
import { Inter, Archivo, Pirata_One } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/lib/feedback";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { ChatWidget } from "@/components/ChatWidget";
import { InitialLoader } from "@/components/layout/InitialLoader";
import { NewsletterPopup } from "@/components/marketing/NewsletterPopup";

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

export const metadata: Metadata = {
  title: "HYPADO · Streetwear Nordestino",
  description: "Coleção HYPADO. Streetwear premium feito no nordeste do Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${archivo.variable} ${pirata.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <InitialLoader />
        <CartProvider>
          <ToastProvider>
            <RouteProgress />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
            <NewsletterPopup />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
