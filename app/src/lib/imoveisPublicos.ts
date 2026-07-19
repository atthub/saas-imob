import { prisma } from "./prisma";

// Select resumido — usado em listagens e pelo endpoint público de scroll infinito
export const SELECT_IMOVEL_PUBLICO_RESUMO = {
  id: true,
  codigo: true,
  titulo: true,
  tipo: true,
  finalidade: true,
  valorVenda: true,
  valorLocacao: true,
  quartos: true,
  vagasGaragem: true,
  areaTotal: true,
  fotos: { select: { url: true, capa: true }, orderBy: { ordem: "asc" as const } },
  cidade: { select: { nome: true } },
  bairro: { select: { nome: true } }
} as const;

export type ImovelResumo = ReturnType<typeof imovelParaResumo>;

// Select "seguro" para a vitrine pública: NUNCA inclui os campos internos de
// proprietário/locatário (contrato, dados pessoais). Use sempre este select
// (ou um subconjunto dele) em qualquer consulta pública de imóveis.
export const SELECT_IMOVEL_PUBLICO = {
  id: true,
  codigo: true,
  titulo: true,
  descricao: true,
  tipo: true,
  finalidade: true,
  status: true,
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
  bairro: { select: { id: true, nome: true } },
  cidade: { select: { id: true, nome: true } },
  latitude: true,
  longitude: true,
  exibirMapa: true,
  destaque: true,
  fotos: { select: { id: true, url: true, ordem: true, capa: true }, orderBy: { ordem: "asc" as const } },
  videos: { select: { id: true, url: true, tipo: true } },
  caracteristicas: { select: { caracteristica: { select: { id: true, nome: true, icone: true } } } },
  condominioCaracteristicas: {
    select: { caracteristica: { select: { id: true, nome: true, icone: true } } }
  },
  criadoEm: true
} as const;

export function imovelParaResumo(imovel: {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  finalidade: string;
  valorVenda: unknown;
  valorLocacao: unknown;
  quartos: number | null;
  vagasGaragem: number | null;
  areaTotal: unknown;
  fotos: { url: string; capa: boolean }[];
  cidade: { nome: string } | null;
  bairro: { nome: string } | null;
}) {
  const capa = imovel.fotos.find((f) => f.capa) || imovel.fotos[0];
  return {
    id: imovel.id,
    codigo: imovel.codigo,
    titulo: imovel.titulo,
    tipo: imovel.tipo,
    finalidade: imovel.finalidade,
    valorVenda: imovel.valorVenda != null ? Number(imovel.valorVenda) : null,
    valorLocacao: imovel.valorLocacao != null ? Number(imovel.valorLocacao) : null,
    quartos: imovel.quartos,
    vagasGaragem: imovel.vagasGaragem,
    areaTotal: imovel.areaTotal != null ? Number(imovel.areaTotal) : null,
    fotoCapa: capa?.url || null,
    cidade: imovel.cidade?.nome || null,
    bairro: imovel.bairro?.nome || null
  };
}
