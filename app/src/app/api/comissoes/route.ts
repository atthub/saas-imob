import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/comissoes — lista comissões da imobiliária
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const comissoes = await prisma.comissao.findMany({
    where: {
      imobiliariaId: sessao.imobiliariaId,
      ...(status ? { status } : {})
    },
    include: {
      imovel: { select: { id: true, titulo: true, codigo: true } },
      corretor: { select: { id: true, nome: true } }
    },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ comissoes });
}

// POST /api/comissoes — cria nova comissão
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const valorImovel = Number(body.valorImovel);
  if (!valorImovel || valorImovel <= 0) {
    return NextResponse.json({ erro: "Valor do imóvel inválido." }, { status: 400 });
  }

  const tipo = ["VENDA", "LOCACAO"].includes(body.tipo) ? body.tipo : null;
  if (!tipo) {
    return NextResponse.json({ erro: "Tipo deve ser VENDA ou LOCACAO." }, { status: 400 });
  }

  const percentualComissao = Number(body.percentualComissao ?? 6);
  const percentualTerceiros = Number(body.percentualTerceiros ?? 30);

  const valorComissao = (valorImovel * percentualComissao) / 100;
  const valorTerceiros = (valorComissao * percentualTerceiros) / 100;

  const comissao = await prisma.comissao.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      imovelId: body.imovelId || undefined,
      corretorId: body.corretorId || undefined,
      descricao: typeof body.descricao === "string" ? body.descricao.trim().slice(0, 255) || undefined : undefined,
      tipo,
      valorImovel,
      percentualComissao,
      valorComissao,
      percentualTerceiros,
      valorTerceiros,
      status: "pendente",
      observacoes: typeof body.observacoes === "string" ? body.observacoes.trim().slice(0, 2000) || undefined : undefined,
      dataVenda: body.dataVenda ? new Date(body.dataVenda) : undefined
    }
  });

  return NextResponse.json({ comissao }, { status: 201 });
}
