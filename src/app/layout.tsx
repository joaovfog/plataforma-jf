import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-bricolage",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma JF",
    template: "%s · Plataforma JF",
  },
  description:
    "O canal entre construtoras e imobiliárias do litoral catarinense: catálogo, tabelas de vendas e espelho em tempo real.",
};

export const viewport: Viewport = {
  themeColor: "#175A67",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${bricolage.variable} ${instrument.variable} ${plexMono.variable}`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
