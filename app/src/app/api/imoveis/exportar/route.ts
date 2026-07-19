import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/imoveis/exportar?filtro=todos|ativos|inativos|destaque
// Retorna todos os campos do imóvel com URLs completas das fotos (separadas por ;)
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const filtro = new URL(request.url).searchParams.get("filtro") || "todos";

  const where: Record<string, unknown> = { imobiliariaId: sessao.imobiliariaId };
  if (filtro === "ativos")   where.status = { not: "INATIVO" };
  if (filtro === "inativos") where.status = "INATIVO";
  if (filtro === "destaque") where.destaque = true;

  const imoveis = await prisma.imovel.findMany({
    where,
    include: {
      fotos: { orderBy: { ordem: "asc" } },
      cidade: true,
      bairro: true
    },
    orderBy: { criadoEm: "desc" }
  });

  const dados = imoveis.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    titulo: i.titulo,
    tipo: i.tipo,
    finalidade: i.finalidade,
    status: i.status,
    destaque: i.destaque ? "Sim" : "Não",
    valorVenda: i.valorVenda ? Number(i.valorVenda).toFixed(2) : "",
    valorLocacao: i.valorLocacao ? Number(i.valorLocacao).toFixed(2) : "",
    valorCondominio: i.valorCondominio ? Number(i.valorCondominio).toFixed(2) : "",
    valorIptu: i.valorIptu ? Number(i.valorIptu).toFixed(2) : "",
    areaTotal: i.areaTotal ? Number(i.areaTotal).toFixed(2) : "",
    areaConstruida: i.areaConstruida ? Number(i.areaConstruida).toFixed(2) : "",
    quartos: i.quartos ?? "",
    suites: i.suites ?? "",
    banheiros: i.banheiros ?? "",
    vagasGaragem: i.vagasGaragem ?? "",
    endereco: i.endereco || "",
    numero: i.numero || "",
    complemento: i.complemento || "",
    cep: i.cep || "",
    cidade: i.cidade?.nome || "",
    uf: i.cidade?.uf || "",
    bairro: i.bairro?.nome || "",
    descricao: (i.descricao || "").replace(/\n/g, " "),
    fotos: i.fotos.map((f) => f.url).join(";"),
    criadoEm: new Date(i.criadoEm).toLocaleString("pt-BR")
  }));

  return NextResponse.json({ imoveis: dados });
}
