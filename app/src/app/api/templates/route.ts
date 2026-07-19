import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/templates -> lista os templates de vitrine disponíveis para
// seleção na tela de Configurações. Hoje existe apenas o layout padrão do
// código (não está no banco, é o "null" / ausência de templateId); os
// registros retornados aqui são variações adicionais que forem cadastradas
// no futuro.
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const templates = await prisma.template.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, descricao: true, thumbnailUrl: true, identificador: true }
  });

  return NextResponse.json({ templates });
}
