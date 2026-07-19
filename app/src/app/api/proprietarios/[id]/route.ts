import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";

// GET /api/proprietarios/[id] -> detalhe de um proprietário com os imóveis vinculados.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const proprietario = await prisma.proprietario.findUnique({
    where: { id: params.id },
    include: { imoveis: { select: { id: true, codigo: true, titulo: true, status: true } } }
  });

  if (!proprietario || proprietario.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Proprietário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ proprietario });
}

// DELETE /api/proprietarios/[id] -> remove um proprietário (apenas se não tiver imóveis vinculados)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const existente = await prisma.proprietario.findUnique({
    where: { id: params.id },
    include: { _count: { select: { imoveis: true } } }
  });
  if (!existente || existente.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Proprietário não encontrado." }, { status: 404 });
  }
  if (existente._count.imoveis > 0) {
    return NextResponse.json(
      { erro: `Não é possível excluir: este proprietário possui ${existente._count.imoveis} imóvel(is) vinculado(s). Desvincule-os primeiro.` },
      { status: 400 }
    );
  }

  await prisma.proprietario.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "PROPRIETARIO_EXCLUIDO",
      entidade: "proprietario",
      entidadeId: params.id,
      detalhes: { nome: existente.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}

// PUT /api/proprietarios/[id] -> edita nome/telefone/e-mail/observações.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para editar proprietários." }, { status: 403 });
  }

  const existente = await prisma.proprietario.findUnique({ where: { id: params.id } });
  if (!existente || existente.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Proprietário não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.nome !== "string" || !body.nome.trim()) {
    return NextResponse.json({ erro: "Informe o nome do proprietário." }, { status: 400 });
  }
  if (typeof body.telefone !== "string" || !body.telefone.trim()) {
    return NextResponse.json({ erro: "Informe o telefone do proprietário." }, { status: 400 });
  }

  const proprietario = await prisma.proprietario.update({
    where: { id: params.id },
    data: {
      nome: body.nome.trim(),
      telefone: body.telefone.trim(),
      email: body.email?.trim() || null,
      observacoes: body.observacoes?.trim() || null
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "PROPRIETARIO_ATUALIZADO",
      entidade: "proprietario",
      entidadeId: params.id,
      detalhes: { nome: proprietario.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ proprietario });
}
