import type { Metadata } from "next";
import "./globals.css";

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataUrl =
  process.env.APP_URL ??
  process.env.CF_PAGES_URL ??
  (productionUrl ? `https://${productionUrl}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(metadataUrl),
  title: {
    default: "Notifica AI",
    template: "%s · Notifica AI",
  },
  description:
    "Registre o valor, gere o Pix e receba a confirmação do pagamento.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Notifica AI",
    title: "Notifica AI",
    description: "Pix confirmado. Vendedor avisado.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Notifica AI — Pix confirmado. Vendedor avisado.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notifica AI",
    description: "Pix confirmado. Vendedor avisado.",
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
