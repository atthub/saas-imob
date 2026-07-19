import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { obterUrlBase } from "@/lib/site";

// sitemap.xml dinâmico — mesma proteção com try/catch do manifest.ts:
// rotas de metadados são executadas pelo Next.js durante o build mesmo com
// force-dynamic, então precisamos tolerar banco desatualizado sem quebrar.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = obterUrlBase();

  let imobiliaria: Awaited<ReturnType<typeof obterImobiliariaAtual>> = null;
  try {
    imobiliaria = await obterImobiliariaAtual();
  } catch {
    return [{ url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }

  if (!imobiliaria) {
    return [{ url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }

  const imoveis = await prisma.imovel.findMany({
    where: { imobiliariaId: imobiliaria.id, status: { not: "INATIVO" } },
    select: { id: true, atualizadoEm: true },
    orderBy: { atualizadoEm: "desc" }
  });

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...imoveis.map((imovel) => ({
      url: `${base}/imoveis/${imovel.id}`,
      lastModified: imovel.atualizadoEm,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
