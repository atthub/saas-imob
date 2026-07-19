import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { bannerSchema } from "@/lib/validators/banner";
import { registrarAuditoria } from "@/lib/auditoria";

function podeGerenciarBanners(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// PUT /api/banners/[id] -> atualiza um banner
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarBanners(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const banner = await prisma.banner.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!banner) {
    return NextResponse.json({ erro: "Banner não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = bannerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  const atualizado = await prisma.banner.update({
    where: { id: params.id },
    data: {
      titulo: dados.titulo,
      urlDesktop: dados.urlDesktop,
      urlMobile: dados.urlMobile,
      link: dados.link,
      ordem: dados.ordem,
      ativo: dados.ativo
    }
  });

  return NextResponse.json({ ok: true, banner: atualizado });
}

// DELETE /api/banners/[id] -> remove um banner do slider
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarBanners(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const banner = await prisma.banner.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!banner) {
    return NextResponse.json({ erro: "Banner não encontrado." }, { status: 404 });
  }

  await prisma.banner.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "BANNER_EXCLUIDO",
      entidade: "banner",
      entidadeId: params.id,
      detalhes: { titulo: banner.titulo || "sem título" },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}
