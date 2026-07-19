import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/landing-pages/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const lp = await prisma.landingPage.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    include: {
      imovel: {
        select: {
          id: true, codigo: true, titulo: true, descricao: true,
          valorVenda: true, valorLocacao: true,
          tipo: true, finalidade: true, status: true,
          quartos: true, banheiros: true, suites: true, vagasGaragem: true,
          areaTotal: true, areaConstruida: true,
          endereco: true, cidade: true, bairro: true,
          fotos: { where: { capa: true }, take: 1, select: { url: true } }
        }
      }
    }
  });

  if (!lp) return NextResponse.json({ erro: "Landing page não encontrada." }, { status: 404 });
  return NextResponse.json({ landingPage: lp });
}

// PUT /api/landing-pages/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const lp = await prisma.landingPage.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!lp) return NextResponse.json({ erro: "Landing page não encontrada." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { titulo, descricao, cta, status } = body;

  const atualizado = await prisma.landingPage.update({
    where: { id: params.id },
    data: {
      titulo: typeof titulo === "string" ? titulo.trim().slice(0, 255) : lp.titulo,
      descricao: typeof descricao === "string" ? descricao.trim().slice(0, 5000) : lp.descricao,
      cta: typeof cta === "string" ? cta.trim().slice(0, 100) : lp.cta,
      status: status === "publicada" || status === "rascunho" ? status : lp.status
    }
  });

  return NextResponse.json({ landingPage: atualizado });
}

// DELETE /api/landing-pages/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const lp = await prisma.landingPage.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!lp) return NextResponse.json({ erro: "Landing page não encontrada." }, { status: 404 });

  await prisma.landingPage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
