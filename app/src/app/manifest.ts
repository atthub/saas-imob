import type { MetadataRoute } from "next";
import { obterImobiliariaAtual } from "@/lib/tenant";

// manifest.webmanifest dinâmico por imobiliária: nome, cores e ícone vêm do
// banco (cada deploy atende uma única imobiliária — modelo white-label).
// O Next.js executa rotas de metadados durante o build mesmo com force-dynamic,
// então protegemos com try/catch para que um banco desatualizado (coluna
// ainda não migrada) não quebre o build.
export const dynamic = "force-dynamic";

function tipoMime(url: string): string {
  const semQuery = url.split("?")[0].toLowerCase();
  if (semQuery.endsWith(".svg")) return "image/svg+xml";
  if (semQuery.endsWith(".jpg") || semQuery.endsWith(".jpeg")) return "image/jpeg";
  if (semQuery.endsWith(".webp")) return "image/webp";
  return "image/png";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // try/catch: rotas de metadados são executadas durante o build mesmo com
  // force-dynamic — se o banco tiver colunas ainda não migradas, o build não quebra.
  let imobiliaria: Awaited<ReturnType<typeof obterImobiliariaAtual>> = null;
  try {
    imobiliaria = await obterImobiliariaAtual();
  } catch {
    // banco indisponível ou schema desatualizado no momento do build → padrão
  }

  const nome = imobiliaria?.nome || "Vitrine Imobiliária";
  const icone = imobiliaria?.logoUrl || imobiliaria?.faviconUrl || "/icon-app.svg";

  return {
    name: nome,
    short_name: nome.length > 18 ? `${nome.slice(0, 17)}…` : nome,
    description: imobiliaria?.heroSubtitulo || "Encontre o imóvel ideal para comprar ou alugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: imobiliaria?.corFundo || "#F5F7FA",
    theme_color: imobiliaria?.corPrimaria || "#0D0D0D",
    icons: [
      { src: icone, sizes: "192x192", type: tipoMime(icone), purpose: "any" },
      { src: icone, sizes: "512x512", type: tipoMime(icone), purpose: "any" }
    ]
  };
}
