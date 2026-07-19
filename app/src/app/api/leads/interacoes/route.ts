import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/leads/interacoes?leadId=xxx
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const leadId = new URL(request.url).searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ erro: "leadId obrigatório." }, { status: 400 });

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, imobiliariaId: sessao.imobiliariaId }
  });
  if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

  const interacoes = await (prisma as any).interacaoLead.findMany({
    where: { leadId },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ interacoes });
}

// POST /api/leads/interacoes
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { leadId, tipo, descricao, dataAgendada } = body;

  if (!leadId || typeof descricao !== "string" || !descricao.trim()) {
    return NextResponse.json({ erro: "leadId e descrição são obrigatórios." }, { status: 400 });
  }

  const tiposValidos = ["NOTA", "LIGACAO", "WHATSAPP", "VISITA_AGENDADA", "VISITA_REALIZADA"];
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, imobiliariaId: sessao.imobiliariaId }
  });
  if (!lead) return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });

  const interacao = await (prisma as any).interacaoLead.create({
    data: {
      leadId,
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      tipo,
      descricao: descricao.trim(),
      dataAgendada: dataAgendada ? new Date(dataAgendada) : null
    }
  });

  return NextResponse.json({ interacao }, { status: 201 });
}
