import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// POST /api/proprietarios/[id]/vincular -> liga um imóvel já cadastrado a
// este proprietário (sem precisar recadastrar os dados do proprietário).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para vincular imóveis." }, { status: 403 });
  }

  const proprietario = await prisma.proprietario.findUnique({ where: { id: params.id } });
  if (!proprietario || proprietario.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Proprietário não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.imovelId !== "string" || !body.imovelId) {
    return NextResponse.json({ erro: "Informe o imóvel a vincular." }, { status: 400 });
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: body.imovelId } });
  if (!imovel || imovel.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  await prisma.imovel.update({
    where: { id: imovel.id },
    data: {
      proprietarioId: proprietario.id,
      proprietarioNome: proprietario.nome,
      proprietarioTelefone: proprietario.telefone,
      proprietarioEmail: proprietario.email || undefined
    }
  });

  return NextResponse.json({ sucesso: true });
}
