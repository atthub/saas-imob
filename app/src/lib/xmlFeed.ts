/**
 * lib/xmlFeed.ts — autenticação e busca de dados compartilhados pelos feeds XML
 * (OLX, Viva Real, Zap Imóveis, Meta Home Listings).
 */
import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type ImobiliariaFeed = NonNullable<Awaited<ReturnType<typeof obterImobiliariaAtual>>>;

export type ImovelFeed = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  finalidade: string;
  valorVenda: { toNumber(): number } | null;
  valorLocacao: { toNumber(): number } | null;
  valorCondominio: { toNumber(): number } | null;
  valorIptu: { toNumber(): number } | null;
  areaTotal: { toNumber(): number } | null;
  areaConstruida: { toNumber(): number } | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagasGaragem: number | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
  cidade: { nome: string; uf: string } | null;
  bairro: { nome: string } | null;
  latitude: number | null;
  longitude: number | null;
  fotos: Array<{ url: string; capa: boolean }>;
};

// ─── Autenticação ────────────────────────────────────────────────────────────

export type XmlAcessoOk    = { ok: true; imobiliaria: ImobiliariaFeed };
export type XmlAcessoErro  = { ok: false; status: number; erro: string };

export async function verificarAcessoXml(
  token: string | null
): Promise<XmlAcessoOk | XmlAcessoErro> {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) {
    return { ok: false, status: 404, erro: "Imobiliária não encontrada." };
  }
  if (!imobiliaria.xmlHabilitado) {
    return { ok: false, status: 403, erro: "Feed XML não habilitado para esta imobiliária." };
  }
  if (!imobiliaria.xmlToken || token !== imobiliaria.xmlToken) {
    return { ok: false, status: 401, erro: "Token inválido ou ausente." };
  }
  return { ok: true, imobiliaria };
}

// ─── Busca de imóveis ────────────────────────────────────────────────────────

export async function buscarImoveisParaFeed(imobiliariaId: string): Promise<ImovelFeed[]> {
  return prisma.imovel.findMany({
    where: { imobiliariaId, status: "DISPONIVEL" },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      codigo: true,
      titulo: true,
      descricao: true,
      tipo: true,
      finalidade: true,
      valorVenda: true,
      valorLocacao: true,
      valorCondominio: true,
      valorIptu: true,
      areaTotal: true,
      areaConstruida: true,
      quartos: true,
      suites: true,
      banheiros: true,
      vagasGaragem: true,
      endereco: true,
      numero: true,
      complemento: true,
      cep: true,
      cidade: { select: { nome: true, uf: true } },
      bairro: { select: { nome: true } },
      latitude: true,
      longitude: true,
      fotos: {
        select: { url: true, capa: true },
        orderBy: { ordem: "asc" },
        take: 20,
      },
    },
  }) as unknown as ImovelFeed[];
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

/** Escapa caracteres especiais para uso em conteúdo XML */
export function escXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Retorna a foto capa (ou a primeira disponível) */
export function fotoCapaUrl(fotos: ImovelFeed["fotos"]): string | null {
  const capa = fotos.find((f) => f.capa);
  return capa?.url ?? fotos[0]?.url ?? null;
}

/** Mapeia TipoImovel → categoria OLX */
export function tipoParaOlxCategoria(tipo: string): string {
  const mapa: Record<string, string> = {
    APARTAMENTO: "Apartamentos",
    CASA: "Casas",
    KITNET: "Apartamentos",
    TERRENO: "Terrenos, sítios e fazendas",
    CHACARA: "Terrenos, sítios e fazendas",
    SALA_COMERCIAL: "Salas e lojas comerciais",
    GALPAO: "Galpões e depósitos",
    ESPACO_FESTAS: "Outros",
    OUTRO: "Outros",
  };
  return mapa[tipo] ?? "Outros";
}

/** Mapeia TipoImovel → PropertyType VivaReal/Zap */
export function tipoParaVivaRealPropertyType(tipo: string): string {
  const mapa: Record<string, string> = {
    APARTAMENTO: "Residential/Apartment",
    CASA: "Residential/Home",
    KITNET: "Residential/Kitnet",
    TERRENO: "Land/Lot",
    CHACARA: "Rural/Farm",
    SALA_COMERCIAL: "Commercial/Office",
    GALPAO: "Commercial/Warehouse",
    ESPACO_FESTAS: "Commercial/Other",
    OUTRO: "Residential/Other",
  };
  return mapa[tipo] ?? "Residential/Other";
}

/** Mapeia FinalidadeImovel → TransactionType VivaReal/Zap */
export function finalidadeParaTransactionType(finalidade: string): string {
  if (finalidade === "VENDA") return "For Sale";
  if (finalidade === "LOCACAO") return "For Rent";
  return "For Sale and Rent";
}

/** Formata valor Decimal para string sem decimais desnecessários */
export function formatarPreco(val: { toNumber(): number } | null): string {
  if (!val) return "";
  const n = val.toNumber();
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
