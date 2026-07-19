import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

const PLATAFORMAS_VALIDAS = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "whatsapp"];

// PUT /api/redes-sociais/:id -> atualiza url/plataforma/ordem de uma rede
// social já cadastrada (sempre validando que pertence à imobiliária da sessão).
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar configurações." }, { status: 403 });
  }

  const existente = await prisma.redeSocial.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!existente) {
    return NextResponse.json({ erro: "Rede social não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  let plataforma: string | undefined;
  if (typeof body.plataforma === "string") {
    const valor = body.plataforma.trim().toLowerCase();
    if (!PLATAFORMAS_VALIDAS.includes(valor)) {
      return NextResponse.json(
        { erro: `Plataforma inválida. Use uma destas: ${PLATAFORMAS_VALIDAS.join(", ")}.` },
        { status: 400 }
      );
    }
    plataforma = valor;
  }

  let url: string | undefined;
  if (typeof body.url === "string") {
    const valor = body.url.trim();
    if (!valor || !/^https?:\/\//i.test(valor)) {
      return NextResponse.json({ erro: "Informe uma URL válida, começando com http:// ou https://." }, { status: 400 });
    }
    url = valor;
  }

  const ordem = typeof body.ordem === "number" ? Math.round(body.ordem) : undefined;

  const redeSocial = await prisma.redeSocial.update({
    where: { id: params.id },
    data: {
      ...(plataforma !== undefined ? { plataforma } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(ordem !== undefined ? { ordem } : {})
    }
  });

  return NextResponse.json({ redeSocial });
}

// DELETE /api/redes-sociais/:id -> remove uma rede social cadastrada.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar configurações." }, { status: 403 });
  }

  const existente = await prisma.redeSocial.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!existente) {
    return NextResponse.json({ erro: "Rede social não encontrada." }, { status: 404 });
  }

  await prisma.redeSocial.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
