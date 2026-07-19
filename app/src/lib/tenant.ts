import { cache } from "react";
import { prisma } from "./prisma";

// Em produção, cada deploy desse sistema atende UMA imobiliária (modelo
// "white label": o mesmo código é reaproveitado para clientes diferentes,
// cada um com seu próprio banco/deploy). O slug do tenant ativo vem da
// variável de ambiente DEFAULT_TENANT_SLUG.
const TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || "delta-imoveis-pinda";

// cache() evita repetir a mesma consulta várias vezes dentro do mesmo request
// (várias partes da página pública precisam dos dados da imobiliária).
export const obterImobiliariaAtual = cache(async function obterImobiliariaAtual() {
  const imobiliaria = await prisma.imobiliaria.findUnique({
    where: { slug: TENANT_SLUG },
    include: { redesSociais: { orderBy: { ordem: "asc" } }, template: true }
  });
  return imobiliaria;
});
