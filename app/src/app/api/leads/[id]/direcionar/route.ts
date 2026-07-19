import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";

// Botão "Direcionar para corretor" no painel do administrador.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { corretorId } = await request.json();
  if (!corretorId) {
    return NextResponse.json({ erro: "Selecione um corretor." }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!lead) {
    return NextResponse.json({ erro: "Lead não encontrado." }, { status: 404 });
  }

  const corretor = await prisma.corretor.findFirst({
    where: { id: corretorId, imobiliariaId: sessao.imobiliariaId },
    select: { nome: true }
  });

  const atualizado = await prisma.lead.update({
    where: { id: params.id },
    data: { corretorId, status: "DIRECIONADO", direcionadoEm: new Date() }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "LEAD_DIRECIONADO",
      entidade: "lead",
      entidadeId: params.id,
      detalhes: { nomeLead: lead.nome, corretor: corretor?.nome ?? corretorId },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ lead: atualizado });
}
