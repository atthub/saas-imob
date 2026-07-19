import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// DELETE /api/leads/interacoes/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const interacao = await (prisma as any).interacaoLead.findUnique({ where: { id: params.id } });
  if (!interacao || interacao.imobiliariaId !== sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  await (prisma as any).interacaoLead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
