import type { Metadata } from "next";
import "./globals.css";
import { obterImobiliariaAtual } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const imobiliaria = await obterImobiliariaAtual();
  return {
    title: imobiliaria?.nome || "Plataforma Imobiliária",
    description: "Encontre o imóvel ideal para comprar ou alugar.",
    icons: imobiliaria?.faviconUrl ? { icon: imobiliaria.faviconUrl } : undefined
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const imobiliaria = await obterImobiliariaAtual();

  const tema = {
    "--brand-dark": imobiliaria?.corPrimaria || "#0D0D0D",
    "--brand-gold": imobiliaria?.corSecundaria || "#C5A059",
    "--brand-gold-vivid": imobiliaria?.corDestaque || "#DD8500",
    "--brand-light": imobiliaria?.corFundo || "#F5F7FA",
    "--font-heading": imobiliaria?.fontHeading ? `"${imobiliaria.fontHeading}", sans-serif` : '"Oxygen", sans-serif',
    "--font-body": imobiliaria?.fontBody ? `"${imobiliaria.fontBody}", sans-serif` : '"Inter", sans-serif'
  } as React.CSSProperties;

  return (
    <html lang="pt-BR">
      <body style={tema}>{children}</body>
    </html>
  );
}
