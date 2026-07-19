import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

const STATUS_VALIDOS = ["novo", "em_analise", "aprovado", "recusado"];

// DELETE /api/captacoes/[id] -> remove uma captação e suas fotos
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const existente = await prisma.captacao.findUnique({ where: { id: params.id } });
  if (!existente || existente.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Captação não encontrada." }, { status: 404 });
  }

  // Fotos são deletadas em cascata pelo Prisma (onDelete: Cascade no schema)
  await prisma.captacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// PUT /api/captacoes/[id] -> atualiza o status de uma captação recebida
// (usado no painel admin para mover entre novo/em análise/aprovado/recusado).
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar captações." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.status !== "string" || !STATUS_VALIDOS.includes(body.status)) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  const captacaoExistente = await prisma.captacao.findUnique({ where: { id: params.id } });
  if (!captacaoExistente || captacaoExistente.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Captação não encontrada." }, { status: 404 });
  }

  const captacao = await prisma.captacao.update({
    where: { id: params.id },
    data: { status: body.status },
    include: { fotos: true }
  });

  return NextResponse.json({ captacao });
}
