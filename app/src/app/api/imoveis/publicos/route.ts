import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { imovelParaResumo, SELECT_IMOVEL_PUBLICO_RESUMO } from "@/lib/imoveisPublicos";

export const dynamic = "force-dynamic";

const FINALIDADES = ["VENDA", "LOCACAO", "VENDA_E_LOCACAO"];
const TIPOS = ["CASA", "APARTAMENTO", "TERRENO", "SALA_COMERCIAL", "GALPAO", "CHACARA", "KITNET", "ESPACO_FESTAS", "OUTRO"];

const ORDENACOES: Record<string, object> = {
  recentes:    { criadoEm: "desc" },
  menor_preco: { valorVenda: { sort: "asc", nulls: "last" } },
  maior_preco: { valorVenda: { sort: "desc", nulls: "last" } },
};

// GET /api/imoveis/publicos — listagem paginada para o scroll infinito
export async function GET(request: NextRequest) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return NextResponse.json({ imoveis: [] });

  const { searchParams } = new URL(request.url);
  const pagina = Math.max(1, Number(searchParams.get("pagina") || "1"));
  const limite = Math.min(Math.max(Number(searchParams.get("limite") || "12"), 1), 100);
  const finalidade = FINALIDADES.includes(searchParams.get("finalidade") || "") ? searchParams.get("finalidade") : undefined;
  const tipo = TIPOS.includes(searchParams.get("tipo") || "") ? searchParams.get("tipo") : undefined;
  const busca = searchParams.get("busca")?.trim() || undefined;
  const precoMin = searchParams.get("precoMin") ? Number(searchParams.get("precoMin")) : undefined;
  const precoMax = searchParams.get("precoMax") ? Number(searchParams.get("precoMax")) : undefined;
  const ordenacaoParam = searchParams.get("ordenacao") || "recentes";
  const orderBy = ORDENACOES[ordenacaoParam] ?? ORDENACOES.recentes;

  const finalidadeFiltro = finalidade
    ? { OR: [{ finalidade: finalidade as any }, { finalidade: "VENDA_E_LOCACAO" as any }] }
    : {};

  const precoFiltro = precoMin !== undefined || precoMax !== undefined
    ? { OR: [{ valorVenda: { gte: precoMin, lte: precoMax } }, { valorLocacao: { gte: precoMin, lte: precoMax } }] }
    : {};

  const imoveis = await prisma.imovel.findMany({
    where: {
      imobiliariaId: imobiliaria.id,
      status: "DISPONIVEL",
      ...finalidadeFiltro,
      ...precoFiltro,
      ...(tipo ? { tipo: tipo as any } : {}),
      ...(busca ? { OR: [{ titulo: { contains: busca } }, { codigo: { contains: busca } }, { bairro: { nome: { contains: busca } } }, { cidade: { nome: { contains: busca } } }] } : {})
    },
    orderBy: orderBy as any,
    skip: (pagina - 1) * limite,
    take: limite,
    select: SELECT_IMOVEL_PUBLICO_RESUMO
  });

  return NextResponse.json({ imoveis: imoveis.map(imovelParaResumo) });
}
