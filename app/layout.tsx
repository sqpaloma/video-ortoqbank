import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toaster";

import ConvexClientProvider from "@/components/convex-client-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sifonn = localFont({
  src: "./fonts/sifonn-pro.otf",
  variable: "--font-sifonn",
});

export const metadata: Metadata = {
  title: "OrtoQBank - Banco de Vídeos de Ortopedia",
  description:
    "OrtoQBank - Banco de Vídeos de Ortopedia. Conheça nossa plataforma e garanta sua aprovação na prova da SBOT! Feito por especialistas da USP.",
  keywords:
    "Ortopedia, vídeos, banco de vídeos, ortopedista, residência médica, ortopedia",
  authors: [{ name: "OrtoQBank" }],
  openGraph: {
    title: "OrtoQBank - Banco de Vídeos de Ortopedia",
    description:
      "OrtoQBank - Vídeos de Ortopedia. Conheça nossa plataforma e garanta sua aprovação na prova da SBOT! Feito por especialistas da USP.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrtoQBank - Banco de Vídeos de Ortopedia",
    description:
      "OrtoQBank - Vídeos de Ortopedia. Conheça nossa plataforma e garanta sua aprovação na prova da SBOT! Feito por especialistas da USP.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sifonn.variable} antialiased`}
      >
        <ConvexClientProvider>
          <NuqsAdapter>
            {children}
            <Toaster />
          </NuqsAdapter>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
