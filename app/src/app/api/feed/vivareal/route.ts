/**
 * GET /api/feed/vivareal?token=TOKEN
 *
 * Gera feed XML no formato VivaReal (ListingDataFeed v2).
 * Requer que xmlHabilitado=true e o token correto na query string.
 *
 * Spec: https://ajuda.vivareal.com.br/hc/pt-br (integração via XML)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  verificarAcessoXml,
  buscarImoveisParaFeed,
  escXml,
  tipoParaVivaRealPropertyType,
  finalidadeParaTransactionType,
  formatarPreco,
  type ImovelFeed,
  type ImobiliariaFeed,
} from "@/lib/xmlFeed";

export const dynamic = "force-dynamic";

function gerarXmlListing(imovel: ImovelFeed, baseUrl: string): string {
  const transactionType = finalidadeParaTransactionType(imovel.finalidade);
  const propertyType    = tipoParaVivaRealPropertyType(imovel.tipo);

  const temVenda   = imovel.finalidade !== "LOCACAO" && imovel.valorVenda;
  const temLocacao = imovel.finalidade !== "VENDA"  && imovel.valorLocacao;

  const mediaItems = imovel.fotos
    .map((f, i) => `      <Item medium="image" caption="${i === 0 ? "Foto principal" : `Foto ${i + 1}`}">${escXml(f.url)}</Item>`)
    .join("\n");

  return `    <Listing>
      <ListingID>${escXml(imovel.codigo)}</ListingID>
      <Title>${escXml(imovel.titulo)}</Title>
      <TransactionType>${escXml(transactionType)}</TransactionType>
      <PropertyType>${escXml(propertyType)}</PropertyType>
      ${temVenda   ? `<ListPrice currency="BRL">${escXml(formatarPreco(imovel.valorVenda))}</ListPrice>` : ""}
      ${temLocacao ? `<RentalPrice currency="BRL" period="Monthly">${escXml(formatarPreco(imovel.valorLocacao))}</RentalPrice>` : ""}
      ${imovel.valorCondominio ? `<CondominiumFee currency="BRL">${escXml(formatarPreco(imovel.valorCondominio))}</CondominiumFee>` : ""}
      ${imovel.areaConstruida ? `<LivingArea unit="square metres">${imovel.areaConstruida.toNumber()}</LivingArea>` : ""}
      ${imovel.areaTotal ? `<LotArea unit="square metres">${imovel.areaTotal.toNumber()}</LotArea>` : ""}
      ${imovel.quartos    != null ? `<Bedrooms>${imovel.quartos}</Bedrooms>` : ""}
      ${imovel.suites     != null ? `<Suites>${imovel.suites}</Suites>` : ""}
      ${imovel.banheiros  != null ? `<Bathrooms>${imovel.banheiros}</Bathrooms>` : ""}
      ${imovel.vagasGaragem != null ? `<Garages>${imovel.vagasGaragem}</Garages>` : ""}
      ${imovel.descricao ? `<Description>${escXml(imovel.descricao)}</Description>` : ""}
      <ContactInfo>
        <Website>${escXml(`${baseUrl}/imoveis/${imovel.id}`)}</Website>
      </ContactInfo>
      <Address>
        ${imovel.cidade ? `<State>${escXml(imovel.cidade.nome)}</State>` : ""}
        ${imovel.cidade ? `<StateAbbreviation>${escXml(imovel.cidade.uf)}</StateAbbreviation>` : ""}
        ${imovel.cidade ? `<City>${escXml(imovel.cidade.nome)}</City>` : ""}
        ${imovel.bairro ? `<Neighborhood>${escXml(imovel.bairro.nome)}</Neighborhood>` : ""}
        ${imovel.endereco ? `<Street>${escXml(imovel.endereco)}</Street>` : ""}
        ${imovel.numero ? `<StreetNumber>${escXml(imovel.numero)}</StreetNumber>` : ""}
        ${imovel.cep ? `<PostalCode>${escXml(imovel.cep.replace(/\D/g, ""))}</PostalCode>` : ""}
        <Country>Brasil</Country>
        ${imovel.latitude  != null ? `<Latitude>${imovel.latitude}</Latitude>` : ""}
        ${imovel.longitude != null ? `<Longitude>${imovel.longitude}</Longitude>` : ""}
      </Address>
      ${mediaItems ? `<Media>\n${mediaItems}\n      </Media>` : ""}
    </Listing>`;
}

function gerarXmlVivaReal(imobiliaria: ImobiliariaFeed, imoveis: ImovelFeed[], baseUrl: string): string {
  const listings = imoveis.map((im) => gerarXmlListing(im, baseUrl)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <Provider>${escXml(imobiliaria.nome)}</Provider>
    ${imobiliaria.email ? `<Email>${escXml(imobiliaria.email)}</Email>` : ""}
    ${imobiliaria.telefone ? `<Telephone>${escXml(imobiliaria.telefone)}</Telephone>` : ""}
    <Website>${escXml(baseUrl)}</Website>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
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

  const xml = gerarXmlVivaReal(acesso.imobiliaria, imoveis, baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
