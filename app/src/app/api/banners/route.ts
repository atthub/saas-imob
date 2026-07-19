import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { bannerSchema } from "@/lib/validators/banner";
import { registrarAuditoria } from "@/lib/auditoria";

function podeGerenciarBanners(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// GET /api/banners -> lista banners da imobiliária logada (tela de admin)
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const banners = await prisma.banner.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { ordem: "asc" }
  });

  return NextResponse.json({ banners });
}

// POST /api/banners -> cadastra um novo banner (imagem do slider da hero)
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarBanners(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  const banner = await prisma.banner.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      titulo: dados.titulo || undefined,
      urlDesktop: dados.urlDesktop,
      urlMobile: dados.urlMobile || undefined,
      link: dados.link || undefined,
      ordem: dados.ordem,
      ativo: dados.ativo
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "BANNER_ADICIONADO",
      entidade: "banner",
      entidadeId: banner.id,
      detalhes: { titulo: banner.titulo || "sem título" },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true, banner }, { status: 201 });
}
