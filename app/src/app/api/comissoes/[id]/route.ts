import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

async function verificarAcesso(id: string) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return { erro: "Não autenticado.", status: 401 };
  const comissao = await prisma.comissao.findFirst({
    where: { id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!comissao) return { erro: "Não encontrada.", status: 404 };
  return { sessao, comissao };
}

// GET /api/comissoes/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await verificarAcesso(params.id);
  if ("erro" in result) return NextResponse.json({ erro: result.erro }, { status: result.status });

  const comissao = await prisma.comissao.findUnique({
    where: { id: params.id },
    include: {
      imovel: { select: { id: true, titulo: true, codigo: true } },
      corretor: { select: { id: true, nome: true } }
    }
  });

  return NextResponse.json({ comissao });
}

// PUT /api/comissoes/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await verificarAcesso(params.id);
  if ("erro" in result) return NextResponse.json({ erro: result.erro }, { status: result.status });
  if (result.sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const valorImovel = body.valorImovel !== undefined ? Number(body.valorImovel) : undefined;
  const percentualComissao = body.percentualComissao !== undefined ? Number(body.percentualComissao) : undefined;
  const percentualTerceiros = body.percentualTerceiros !== undefined ? Number(body.percentualTerceiros) : undefined;

  let valorComissao: number | undefined;
  let valorTerceiros: number | undefined;

  const vi = valorImovel ?? Number(result.comissao.valorImovel);
  const pc = percentualComissao ?? Number(result.comissao.percentualComissao);
  const pt = percentualTerceiros ?? Number(result.comissao.percentualTerceiros);

  valorComissao = (vi * pc) / 100;
  valorTerceiros = (valorComissao * pt) / 100;

  const tipo = body.tipo && ["VENDA", "LOCACAO"].includes(body.tipo) ? body.tipo : undefined;

  const comissao = await prisma.comissao.update({
    where: { id: params.id },
    data: {
      ...(tipo ? { tipo } : {}),
      ...(valorImovel ? { valorImovel } : {}),
      ...(percentualComissao !== undefined ? { percentualComissao } : {}),
      ...(percentualTerceiros !== undefined ? { percentualTerceiros } : {}),
      valorComissao,
      valorTerceiros,
      ...(body.status === "pago" || body.status === "pendente" ? { status: body.status } : {}),
      ...(body.descricao !== undefined ? { descricao: String(body.descricao).trim().slice(0, 255) || null } : {}),
      ...(body.observacoes !== undefined ? { observacoes: String(body.observacoes).trim().slice(0, 2000) || null } : {}),
      ...(body.imovelId !== undefined ? { imovelId: body.imovelId || null } : {}),
      ...(body.corretorId !== undefined ? { corretorId: body.corretorId || null } : {}),
      ...(body.dataVenda !== undefined ? { dataVenda: body.dataVenda ? new Date(body.dataVenda) : null } : {})
    }
  });

  return NextResponse.json({ comissao });
}

// DELETE /api/comissoes/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await verificarAcesso(params.id);
  if ("erro" in result) return NextResponse.json({ erro: result.erro }, { status: result.status });
  if (result.sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  await prisma.comissao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
