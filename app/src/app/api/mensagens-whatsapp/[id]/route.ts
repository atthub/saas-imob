import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

type Params = { params: { id: string } };

// PUT /api/mensagens-whatsapp/[id] — atualiza mensagem
export async function PUT(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || sessao.papel === "CORRETOR")
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const existente = await (prisma as any).mensagemWhatsapp.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!existente)
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { titulo, mensagem, ativa } = body;

  const atualizado = await (prisma as any).mensagemWhatsapp.update({
    where: { id: params.id },
    data: {
      ...(titulo !== undefined && { titulo: String(titulo).trim() }),
      ...(mensagem !== undefined && { mensagem: String(mensagem).trim() }),
      ...(ativa !== undefined && { ativa: Boolean(ativa) })
    }
  });

  return NextResponse.json({ mensagem: atualizado });
}

// DELETE /api/mensagens-whatsapp/[id] — remove mensagem
export async function DELETE(_request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || sessao.papel === "CORRETOR")
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const existente = await (prisma as any).mensagemWhatsapp.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!existente)
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  await (prisma as any).mensagemWhatsapp.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
