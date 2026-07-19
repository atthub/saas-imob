import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// GET /api/feed/xml?token=...
// Feed XML público dos imóveis ativos para integração com portais (ZAP, Viva Real, OLX, etc.)
// Requer xmlHabilitado=true na imobiliária. Se xmlToken estiver configurado, exige ?token= correto.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get("token") || "";

  const imobiliariaBase = await obterImobiliariaAtual();
  if (!imobiliariaBase) {
    return new NextResponse("Imobiliária não encontrada.", { status: 404 });
  }

  const imob = await prisma.imobiliaria.findUnique({
    where: { id: imobiliariaBase.id },
    select: {
      id: true,
      nome: true,
      xmlHabilitado: true,
      xmlToken: true,
      cidadePrincipal: true,
      estadoPrincipal: true,
      telefone: true,
      email: true,
    }
  });

  if (!imob) {
    return new NextResponse("Não encontrado.", { status: 404 });
  }

  if (!imob.xmlHabilitado) {
    return new NextResponse("Feed XML não habilitado.", { status: 403 });
  }

  if (imob.xmlToken && imob.xmlToken !== tokenParam) {
    return new NextResponse("Token inválido.", { status: 401 });
  }

  const imoveis = await prisma.imovel.findMany({
    where: {
      imobiliariaId: imob.id,
      status: { not: "INATIVO" }
    },
    include: {
      fotos: { orderBy: { ordem: "asc" } },
      cidade: true,
      bairro: true,
      caracteristicas: { include: { caracteristica: true } },
    },
    orderBy: { criadoEm: "desc" }
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  function esc(val: string | null | undefined): string {
    if (!val) return "";
    return val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function moeda(val: unknown): string {
    if (!val) return "";
    return Number(val).toFixed(2);
  }

  const TIPO_LABEL: Record<string, string> = {
    CASA: "Casa",
    APARTAMENTO: "Apartamento",
    TERRENO: "Terreno",
    SALA_COMERCIAL: "Sala Comercial",
    GALPAO: "Galpão/Depósito",
    CHACARA: "Chácara",
    KITNET: "Kitnet",
    ESPACO_FESTAS: "Espaço para Festas",
    OUTRO: "Outro",
  };

  const FINALIDADE_LABEL: Record<string, string> = {
    VENDA: "Venda",
    LOCACAO: "Locação",
    VENDA_E_LOCACAO: "Venda e Locação",
  };

  const STATUS_LABEL: Record<string, string> = {
    DISPONIVEL: "Disponível",
    VENDIDO: "Vendido",
    ALUGADO: "Alugado",
    RESERVADO: "Reservado",
  };

  const imoveisXml = imoveis.map((im) => {
    const fotos = im.fotos
      .map((f) => `      <Foto><URLArquivo>${esc(siteUrl + f.url)}</URLArquivo></Foto>`)
      .join("\n");

    const caracteristicas = im.caracteristicas
      .map((c) => `      <Caracteristica>${esc(c.caracteristica?.nome)}</Caracteristica>`)
      .join("\n");

    return `  <Imovel>
    <CodigoImovel>${esc(im.codigo)}</CodigoImovel>
    <TipoImovel>${esc(TIPO_LABEL[im.tipo] ?? im.tipo)}</TipoImovel>
    <Finalidade>${esc(FINALIDADE_LABEL[im.finalidade] ?? im.finalidade)}</Finalidade>
    <Situacao>${esc(STATUS_LABEL[im.status] ?? im.status)}</Situacao>
    <Destaque>${im.destaque ? "Sim" : "Não"}</Destaque>
    <Titulo>${esc(im.titulo)}</Titulo>
    <Descricao>${esc(im.descricao ?? "")}</Descricao>
    <URL>${esc(`${siteUrl}/imoveis/${im.id}`)}</URL>
    <ValorVenda>${moeda(im.valorVenda)}</ValorVenda>
    <ValorLocacao>${moeda(im.valorLocacao)}</ValorLocacao>
    <ValorCondominio>${moeda(im.valorCondominio)}</ValorCondominio>
    <ValorIPTU>${moeda(im.valorIptu)}</ValorIPTU>
    <AreaTotal>${im.areaTotal ? Number(im.areaTotal).toFixed(2) : ""}</AreaTotal>
    <AreaConstruida>${im.areaConstruida ? Number(im.areaConstruida).toFixed(2) : ""}</AreaConstruida>
    <Quartos>${im.quartos ?? ""}</Quartos>
    <Suites>${im.suites ?? ""}</Suites>
    <Banheiros>${im.banheiros ?? ""}</Banheiros>
    <Vagas>${im.vagasGaragem ?? ""}</Vagas>
    <Endereco>${esc(im.endereco ?? "")}</Endereco>
    <Numero>${esc(im.numero ?? "")}</Numero>
    <Complemento>${esc(im.complemento ?? "")}</Complemento>
    <CEP>${esc(im.cep ?? "")}</CEP>
    <Bairro>${esc(im.bairro?.nome ?? "")}</Bairro>
    <Cidade>${esc(im.cidade?.nome ?? "")}</Cidade>
    <UF>${esc(im.cidade?.uf ?? "")}</UF>
    <Latitude>${im.latitude ?? ""}</Latitude>
    <Longitude>${im.longitude ?? ""}</Longitude>
    <Visualizacoes>${im.visualizacoes}</Visualizacoes>
    <DataCadastro>${im.criadoEm.toISOString()}</DataCadastro>
    <Fotos>
${fotos}
    </Fotos>
    <Caracteristicas>
${caracteristicas}
    </Caracteristicas>
  </Imovel>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imobiliaria>
    <Nome>${esc(imob.nome)}</Nome>
    <Cidade>${esc(imob.cidadePrincipal ?? "")}</Cidade>
    <UF>${esc(imob.estadoPrincipal ?? "")}</UF>
    <Telefone>${esc(imob.telefone ?? "")}</Telefone>
    <Email>${esc(imob.email ?? "")}</Email>
    <TotalImoveis>${imoveis.length}</TotalImoveis>
    <GeradoEm>${new Date().toISOString()}</GeradoEm>
  </Imobiliaria>
  <Imoveis>
${imoveisXml}
  </Imoveis>
</Carga>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    }
  });
}
