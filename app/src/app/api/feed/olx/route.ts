/**
 * GET /api/feed/olx?token=TOKEN
 *
 * Gera feed XML no formato OLX Imóveis (Brasil).
 * Requer que xmlHabilitado=true e o token correto na query string.
 *
 * Spec: https://ajuda.olx.com.br/hc/pt-br/articles/360001129172
 */
import { NextRequest, NextResponse } from "next/server";
import {
  verificarAcessoXml,
  buscarImoveisParaFeed,
  escXml,
  tipoParaOlxCategoria,
  formatarPreco,
  type ImovelFeed,
  type ImobiliariaFeed,
} from "@/lib/xmlFeed";

export const dynamic = "force-dynamic";

function finalidadeOlx(finalidade: string): string {
  if (finalidade === "VENDA") return "Venda";
  if (finalidade === "LOCACAO") return "Locação";
  return "Venda e Locação";
}

function precoOlx(imovel: ImovelFeed): string {
  if (imovel.finalidade === "LOCACAO") return formatarPreco(imovel.valorLocacao);
  return formatarPreco(imovel.valorVenda) || formatarPreco(imovel.valorLocacao);
}

function gerarXmlImovel(imovel: ImovelFeed, baseUrl: string): string {
  const fotos = imovel.fotos.map((f, i) =>
    i === 0
      ? `      <Imagem principal="true">${escXml(f.url)}</Imagem>`
      : `      <Imagem>${escXml(f.url)}</Imagem>`
  );

  const preco = precoOlx(imovel);

  return `  <Imovel>
    <CodigoParceiro>${escXml(imovel.codigo)}</CodigoParceiro>
    <TituloAnuncio>${escXml(imovel.titulo)}</TituloAnuncio>
    <Categoria>${escXml(tipoParaOlxCategoria(imovel.tipo))}</Categoria>
    <Finalidade>${escXml(finalidadeOlx(imovel.finalidade))}</Finalidade>
    ${preco ? `<Preco>${escXml(preco)}</Preco>` : ""}
    ${imovel.valorCondominio ? `<Condominio>${escXml(formatarPreco(imovel.valorCondominio))}</Condominio>` : ""}
    ${imovel.valorIptu ? `<IPTU>${escXml(formatarPreco(imovel.valorIptu))}</IPTU>` : ""}
    ${imovel.cep ? `<CEP>${escXml(imovel.cep.replace(/\D/g, ""))}</CEP>` : ""}
    ${imovel.bairro ? `<Bairro>${escXml(imovel.bairro.nome)}</Bairro>` : ""}
    ${imovel.cidade ? `<Cidade>${escXml(imovel.cidade.nome)}</Cidade>` : ""}
    ${imovel.cidade ? `<UF>${escXml(imovel.cidade.uf)}</UF>` : ""}
    ${imovel.endereco ? `<Logradouro>${escXml(imovel.endereco)}</Logradouro>` : ""}
    ${imovel.numero ? `<Numero>${escXml(imovel.numero)}</Numero>` : ""}
    ${imovel.quartos != null ? `<Quartos>${imovel.quartos}</Quartos>` : ""}
    ${imovel.banheiros != null ? `<Banheiros>${imovel.banheiros}</Banheiros>` : ""}
    ${imovel.vagasGaragem != null ? `<Garagens>${imovel.vagasGaragem}</Garagens>` : ""}
    ${imovel.areaTotal ? `<AreaUtil>${imovel.areaTotal.toNumber()}</AreaUtil>` : ""}
    ${imovel.areaConstruida ? `<AreaConstruida>${imovel.areaConstruida.toNumber()}</AreaConstruida>` : ""}
    ${imovel.descricao ? `<Descricao>${escXml(imovel.descricao)}</Descricao>` : ""}
    <URL>${escXml(`${baseUrl}/imoveis/${imovel.id}`)}</URL>
    ${fotos.length > 0 ? `<Imagens>\n${fotos.join("\n")}\n    </Imagens>` : ""}
  </Imovel>`;
}

function gerarXmlOlx(imobiliaria: ImobiliariaFeed, imoveis: ImovelFeed[], baseUrl: string): string {
  const itens = imoveis.map((im) => gerarXmlImovel(im, baseUrl)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Imoveis>
${itens}
</Imoveis>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const acesso = await verificarAcessoXml(token);

  if (!acesso.ok) {
    return new NextResponse(acesso.erro, { status: acesso.status });
  }

  const imoveis = await buscarImoveisParaFeed(acesso.imobiliaria.id);
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host  = request.headers.get("host") ?? "";
  const baseUrl = `${proto}://${host}`;

  const xml = gerarXmlOlx(acesso.imobiliaria, imoveis, baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
