import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// POST /api/proprietarios/[id]/desvincular -> remove o vínculo de um imóvel
// com este proprietário (não exclui nem o imóvel, nem o proprietário).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para desvincular imóveis." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.imovelId !== "string" || !body.imovelId) {
    return NextResponse.json({ erro: "Informe o imóvel." }, { status: 400 });
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: body.imovelId } });
  if (!imovel || imovel.imobiliariaId !== sessao.imobiliariaId || imovel.proprietarioId !== params.id) {
    return NextResponse.json({ erro: "Vínculo não encontrado." }, { status: 404 });
  }

  await prisma.imovel.update({ where: { id: imovel.id }, data: { proprietarioId: null } });

  return NextResponse.json({ sucesso: true });
}
