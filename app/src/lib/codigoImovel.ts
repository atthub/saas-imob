import { prisma } from "./prisma";

/**
 * Gera o próximo código automático de imóvel para uma imobiliária,
 * no formato PREFIXO + sequência (ex: IM0001, IM0002...).
 * Cada imobiliária tem sua própria sequência (códigos únicos por tenant).
 */
export async function gerarCodigoAutomatico(imobiliariaId: string, prefixo = "IM") {
  const total = await prisma.imovel.count({ where: { imobiliariaId } });
  const proximo = total + 1;
  let codigo = `${prefixo}${String(proximo).padStart(4, "0")}`;

  // Garante unicidade mesmo se algum código manual já tiver usado esse valor
  let tentativa = proximo;
  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma.imovel.findFirst({
      where: { imobiliariaId, codigo }
    })
  ) {
    tentativa += 1;
    codigo = `${prefixo}${String(tentativa).padStart(4, "0")}`;
  }

  return codigo;
}
