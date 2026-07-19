import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/mensagens-whatsapp — lista mensagens da imobiliária logada
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const mensagens = await (prisma as any).mensagemWhatsapp.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { criadoEm: "asc" }
  });

  return NextResponse.json({ mensagens });
}

// POST /api/mensagens-whatsapp — cria nova mensagem
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || sessao.papel === "CORRETOR")
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { titulo, mensagem } = body;

  if (!titulo?.trim() || !mensagem?.trim())
    return NextResponse.json({ erro: "Título e mensagem são obrigatórios." }, { status: 400 });

  const nova = await (prisma as any).mensagemWhatsapp.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      titulo: titulo.trim(),
      mensagem: mensagem.trim()
    }
  });

  return NextResponse.json({ mensagem: nova }, { status: 201 });
}
