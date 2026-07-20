/**
 * GET /api/feed/meta?token=TOKEN
 *
 * Gera feed XML no formato Meta Home Listings (Catálogo de Imóveis para Meta Ads).
 * Requer que xmlHabilitado=true e o token correto na query string.
 *
 * Cadastre esta URL no Meta Business Manager:
 *   Gerenciador de Negócios → Catálogos → Criar catálogo → Casa e Imóvel
 *   → Adicionar itens → Usar feeds de dados → URL deste endpoint
 *
 * Referência: https://developers.facebook.com/docs/marketing-api/catalog/reference/home-listings
 */
import { NextRequest, NextResponse } from "next/server";
import {
  verificarAcessoXml,
  buscarImoveisParaFeed,
  formatarPreco,
  type ImovelFeed,
  type ImobiliariaFeed,
} from "@/lib/xmlFeed";

export const dynamic = "force-dynamic";

// ─── Mapeamentos Meta ─────────────────────────────────────────────────────────

function tipoParaMetaPropertyType(tipo: string): string {
  const mapa: Record<string, string> = {
    APARTAMENTO:    "apartment",
    CASA:           "house",
    KITNET:         "apartment",
    TERRENO:        "land",
    CHACARA:        "land",
    SALA_COMERCIAL: "condo",
    GALPAO:         "other",
    ESPACO_FESTAS:  "other",
    OUTRO:          "other",
  };
  return mapa[tipo] ?? "other";
}

function finalidadeParaMetaAvailability(finalidade: string): string {
  if (finalidade === "VENDA")   return "for_sale";
  if (finalidade === "LOCACAO") return "for_rent";
  return "for_sale"; // AMBAS → prioriza venda no catálogo
}

function finalidadeParaMetaListingType(finalidade: string): string {
  if (finalidade === "LOCACAO") return "for_rent";
  return "for_sale_by_agent";
}

// ─── Geração de cada <listing> ────────────────────────────────────────────────

function gerarListing(imovel: ImovelFeed, baseUrl: string): string {
  const availability = finalidadeParaMetaAvailability(imovel.finalidade);
  const listingType  = finalidadeParaMetaListingType(imovel.finalidade);
  const propertyType = tipoParaMetaPropertyType(imovel.tipo);

  // Preço: usa valorVenda para venda, valorLocacao para locação
  const precoVal =
    imovel.finalidade === "LOCACAO"
      ? imovel.valorLocacao
      : imovel.valorVenda ?? imovel.valorLocacao;
  const preco = precoVal ? `${formatarPreco(precoVal)} BRL` : "0 BRL";

  // Endereço
  const addr1 = [imovel.endereco, imovel.numero].filter(Boolean).join(", ");
  const bairroStr = imovel.bairro?.nome ?? "";
  const cidadeStr = imovel.cidade?.nome ?? "";
  const ufStr     = imovel.cidade?.uf ?? "BR";
  const cepStr    = imovel.cep?.replace(/\D/g, "") ?? "";

  // URL do imóvel no site
  const imovelUrl = `${baseUrl}/imoveis/${imovel.id}`;

  // Imagens (até 20)
  const imagens = imovel.fotos
    .map((f) => `    <image>\n      <url><![CDATA[${f.url}]]></url>\n    </image>`)
    .join("\n");

  // Título + descrição
  const nome = imovel.titulo || `Imóvel ${imovel.codigo}`;
  const descricao = imovel.descricao || nome;

  const linhas: string[] = [
    `  <listing>`,
    `    <home_listing_id><![CDATA[${imovel.id}]]></home_listing_id>`,
    `    <name><![CDATA[${nome}]]></name>`,
    `    <availability>${availability}</availability>`,
    `    <description><![CDATA[${descricao}]]></description>`,
    `    <price>${preco}</price>`,
    `    <listing_type>${listingType}</listing_type>`,
    `    <property_type>${propertyType}</property_type>`,
    `    <url><![CDATA[${imovelUrl}]]></url>`,
  ];

  // Endereço
  linhas.push(`    <address format="simple">`);
  if (addr1)    linhas.push(`      <component name="addr1"><![CDATA[${addr1}]]></component>`);
  if (bairroStr) linhas.push(`      <component name="addr2"><![CDATA[${bairroStr}]]></component>`);
  if (cidadeStr) linhas.push(`      <component name="city"><![CDATA[${cidadeStr}]]></component>`);
  if (ufStr)    linhas.push(`      <component name="region"><![CDATA[${ufStr}]]></component>`);
  linhas.push(`      <component name="country">BR</component>`);
  if (cepStr)   linhas.push(`      <component name="postal_code"><![CDATA[${cepStr}]]></component>`);
  linhas.push(`    </address>`);

  // Coordenadas
  if (imovel.latitude  != null) linhas.push(`    <latitude>${imovel.latitude}</latitude>`);
  if (imovel.longitude != null) linhas.push(`    <longitude>${imovel.longitude}</longitude>`);

  // Características
  if (imovel.quartos     != null) linhas.push(`    <num_beds>${imovel.quartos}</num_beds>`);
  if (imovel.banheiros   != null) linhas.push(`    <num_baths>${imovel.banheiros}</num_baths>`);
  if (imovel.vagasGaragem != null) linhas.push(`    <parking_spaces>${imovel.vagasGaragem}</parking_spaces>`);

  const area = imovel.areaConstruida ?? imovel.areaTotal;
  if (area != null) {
    linhas.push(`    <area_size>${area.toNumber()}</area_size>`);
    linhas.push(`    <area_size_unit>sq_m</area_size_unit>`);
  }

  // Imagens
  if (imagens) linhas.push(imagens);

  linhas.push(`  </listing>`);
  return linhas.join("\n");
}

// ─── Documento XML completo ───────────────────────────────────────────────────

function gerarXmlMeta(
  imobiliaria: ImobiliariaFeed,
  imoveis: ImovelFeed[],
  baseUrl: string
): string {
  const listings = imoveis.map((im) => gerarListing(im, baseUrl)).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  Meta Home Listings Feed — ${imobiliaria.nome}
  Gerado em: ${new Date().toISOString()}
  Imóveis: ${imoveis.length}
  Cadastre esta URL no Meta Business Manager → Catálogos → Casa e Imóvel
-->
<listings>
${listings}
</listings>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const acesso = await verificarAcessoXml(token);

  if (!acesso.ok) {
    return new NextResponse(acesso.erro, { status: acesso.status });
  }

  const imoveis = await buscarImoveisParaFeed(acesso.imobiliaria.id);
  const proto  = request.headers.get("x-forwarded-proto") ?? "https";
  const host   = request.headers.get("host") ?? "";
  const baseUrl = `${proto}://${host}`;

  const xml = gerarXmlMeta(acesso.imobiliaria, imoveis, baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
