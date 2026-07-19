import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";

const STATUS_VALIDOS = ["NOVO", "DIRECIONADO", "EM_ATENDIMENTO", "CONVERTIDO", "PERDIDO"];

// PUT /api/leads/[id] — atualiza status e/ou observacoes de um lead
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead || lead.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!STATUS_VALIDOS.includes(body.status)) {
      return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.observacoes !== undefined) {
    data.observacoes = body.observacoes || null;
  }

  const atualizado = await prisma.lead.update({ where: { id: params.id }, data });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "LEAD_STATUS_ALTERADO",
      entidade: "lead",
      entidadeId: params.id,
      detalhes: { nome: lead.nome, novoStatus: data.status ?? lead.status },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ lead: atualizado });
}

// DELETE /api/leads/[id] — remove um lead
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead || lead.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "LEAD_EXCLUIDO",
      entidade: "lead",
      entidadeId: params.id,
      detalhes: { nome: lead.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}
