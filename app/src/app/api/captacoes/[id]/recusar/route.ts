import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";

// POST /api/captacoes/[id]/recusar -> marca a captação como recusada, sem criar nenhum imóvel.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para recusar captações." }, { status: 403 });
  }

  const captacao = await prisma.captacao.findUnique({ where: { id: params.id } });
  if (!captacao || captacao.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Captação não encontrada." }, { status: 404 });
  }

  const atualizada = await prisma.captacao.update({
    where: { id: params.id },
    data: { status: "recusado" }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "CAPTACAO_RECUSADA",
      entidade: "captacao",
      entidadeId: captacao.id,
      detalhes: { proprietario: captacao.nomeProprietario },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ captacao: atualizada });
}
