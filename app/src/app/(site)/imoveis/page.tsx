import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { imovelParaResumo, SELECT_IMOVEL_PUBLICO_RESUMO } from "@/lib/imoveisPublicos";
import PropertyCard from "../_components/PropertyCard";
import ImoveisScrollInfinito from "./_components/ImoveisScrollInfinito";
import FiltrosListagem from "./_components/FiltrosListagem";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PRECO_MAX_PADRAO = 30_000_000;

type Props = {
  searchParams: {
    finalidade?: string;
    tipo?: string;
    busca?: string;
    pagina?: string;
    precoMin?: string;
    precoMax?: string;
    ordenacao?: string;
  };
};

const FINALIDADES = ["VENDA", "LOCACAO", "VENDA_E_LOCACAO"];
const TIPOS = ["CASA", "APARTAMENTO", "TERRENO", "SALA_COMERCIAL", "GALPAO", "CHACARA", "KITNET", "ESPACO_FESTAS", "OUTRO"];
const ORDENACOES: Record<string, object> = {
  recentes:    { criadoEm: "desc" },
  menor_preco: { valorVenda: { sort: "asc", nulls: "last" } },
  maior_preco: { valorVenda: { sort: "desc", nulls: "last" } },
};

export default async function ImoveisPage({ searchParams }: Props) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return null;

  const tipoPaginacao = (imobiliaria as any).tipoPaginacao || "paginada";
  const itensPorPagina = (imobiliaria as any).itensPorPagina || 12;
  const paginaAtual = Math.max(1, Number(searchParams.pagina || "1"));

  const finalidade = FINALIDADES.includes(searchParams.finalidade || "") ? searchParams.finalidade : undefined;
  const tipo = TIPOS.includes(searchParams.tipo || "") ? searchParams.tipo : undefined;
  const busca = searchParams.busca?.trim() || undefined;
  const precoMin = searchParams.precoMin ? Number(searchParams.precoMin) : undefined;
  const precoMax = searchParams.precoMax ? Number(searchParams.precoMax) : undefined;
  const ordenacao = ["recentes", "menor_preco", "maior_preco"].includes(searchParams.ordenacao || "")
    ? (searchParams.ordenacao as string)
    : "recentes";

  const orderBy = ORDENACOES[ordenacao] ?? ORDENACOES.recentes;

  // Ao filtrar por VENDA ou LOCACAO, incluir também VENDA_E_LOCACAO
  const finalidadeFiltro = finalidade
    ? { OR: [{ finalidade: finalidade as any }, { finalidade: "VENDA_E_LOCACAO" as any }] }
    : {};

  const precoFiltro = precoMin !== undefined || precoMax !== undefined
    ? {
        OR: [
          { valorVenda: { gte: precoMin, lte: precoMax } },
          { valorLocacao: { gte: precoMin, lte: precoMax } }
        ]
      }
    : {};

  const whereClause = {
    imobiliariaId: imobiliaria.id,
    status: "DISPONIVEL" as const,
    ...finalidadeFiltro,
    ...precoFiltro,
    ...(tipo ? { tipo: tipo as any } : {}),
    ...(busca
      ? {
          AND: [
            {
              OR: [
                { titulo: { contains: busca } },
                { codigo: { contains: busca } },
                { bairro: { nome: { contains: busca } } },
                { cidade: { nome: { contains: busca } } }
              ]
            }
          ]
        }
      : {})
  };

  const [imoveis, totalCount, precoAggregate] = await Promise.all([
    prisma.imovel.findMany({
      where: whereClause,
      orderBy: orderBy as any,
      skip: (paginaAtual - 1) * itensPorPagina,
      take: itensPorPagina,
      select: SELECT_IMOVEL_PUBLICO_RESUMO
    }),
    tipoPaginacao === "paginada"
      ? prisma.imovel.count({ where: whereClause })
      : Promise.resolve(0),
    prisma.imovel.aggregate({
      _max: { valorVenda: true, valorLocacao: true },
      where: { imobiliariaId: imobiliaria.id, status: "DISPONIVEL" }
    })
  ]);

  // Teto dinâmico: pega o maior valor do banco, arredonda para cima em 100k
  const maxVenda = precoAggregate._max.valorVenda ?? 0;
  const maxLocacao = precoAggregate._max.valorLocacao ?? 0;
  const precoMaxBanco = Math.max(Number(maxVenda), Number(maxLocacao));
  const precoMaxAbsoluto = precoMaxBanco > 0
    ? Math.ceil(precoMaxBanco / 100_000) * 100_000
    : PRECO_MAX_PADRAO;

  const imoveisResumo = imoveis.map(imovelParaResumo);
  const totalPaginas = tipoPaginacao === "paginada" ? Math.ceil(totalCount / itensPorPagina) : 1;
  const totalExibido = tipoPaginacao === "paginada" ? totalCount : imoveisResumo.length;

  function buildUrl(pagina: number) {
    const p = new URLSearchParams();
    if (finalidade) p.set("finalidade", finalidade);
    if (tipo) p.set("tipo", tipo);
    if (busca) p.set("busca", busca);
    if (precoMin) p.set("precoMin", String(precoMin));
    if (precoMax) p.set("precoMax", String(precoMax));
    if (ordenacao !== "recentes") p.set("ordenacao", ordenacao);
    if (pagina > 1) p.set("pagina", String(pagina));
    const qs = p.toString();
    return `/imoveis${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-brand-dark mb-1">Imóveis disponíveis</h1>
      <p className="text-sm text-gray-500 mb-6">
        {totalExibido > 0
          ? `${totalExibido} ${totalExibido === 1 ? "imóvel encontrado" : "imóveis encontrados"}`
          : "Nenhum imóvel encontrado"}
      </p>

      {/* Barra de filtros — key força remontagem quando URL muda, evitando
          estado obsoleto no useState do componente client-side */}
      <FiltrosListagem
        key={`${finalidade || ""}_${tipo || ""}_${busca || ""}_${precoMin ?? 0}_${precoMax ?? precoMaxAbsoluto}_${ordenacao}`}
        finalidadeInicial={finalidade || ""}
        tipoInicial={tipo || ""}
        buscaInicial={busca || ""}
        precoMinInicial={precoMin ?? 0}
        precoMaxInicial={precoMax ?? precoMaxAbsoluto}
        ordenacaoInicial={ordenacao}
        precoMaxAbsoluto={precoMaxAbsoluto}
      />

      {imoveisResumo.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhum imóvel encontrado para esses filtros.</p>
      ) : tipoPaginacao === "scroll-infinito" ? (
        <ImoveisScrollInfinito
          imoveisIniciais={imoveisResumo}
          itensPorLote={itensPorPagina}
          searchParams={{
            finalidade,
            tipo,
            busca,
            precoMin: precoMin ? String(precoMin) : undefined,
            precoMax: precoMax ? String(precoMax) : undefined,
            ordenacao: ordenacao !== "recentes" ? ordenacao : undefined
          }}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imoveisResumo.map((imovel) => (
              <PropertyCard key={imovel.id} imovel={imovel} />
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
              {paginaAtual > 1 && (
                <Link href={buildUrl(paginaAtual - 1)} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 2)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl(p as number)}
                      className={`px-4 py-2 rounded-md border text-sm ${
                        p === paginaAtual
                          ? "bg-brand-goldVivid text-white border-brand-goldVivid"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
              {paginaAtual < totalPaginas && (
                <Link href={buildUrl(paginaAtual + 1)} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
