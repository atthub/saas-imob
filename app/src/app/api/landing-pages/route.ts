import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// GET /api/landing-pages -> lista as landing pages da imobiliária
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const landingPages = await prisma.landingPage.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    include: {
      imovel: { select: { id: true, codigo: true, titulo: true, fotos: { where: { capa: true }, take: 1, select: { url: true } } } }
    },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ landingPages });
}

// POST /api/landing-pages -> cria uma nova landing page para um imóvel
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { imovelId, titulo, descricao, cta, status } = body;

  if (!imovelId) {
    return NextResponse.json({ erro: "imovelId é obrigatório." }, { status: 400 });
  }

  // Verifica se o imóvel pertence à imobiliária
  const imovel = await prisma.imovel.findFirst({
    where: { id: imovelId, imobiliariaId: sessao.imobiliariaId }
  });
  if (!imovel) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  // Verifica se já existe landing page para este imóvel
  const existente = await prisma.landingPage.findUnique({ where: { imovelId } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma landing page para este imóvel." }, { status: 409 });
  }

  // Gera slug único baseado no código do imóvel
  const baseSlug = slugify(`${imovel.codigo}-${imovel.titulo}`);
  let slug = baseSlug;
  let tentativa = 0;
  while (await prisma.landingPage.findUnique({ where: { slug } })) {
    tentativa++;
    slug = `${baseSlug}-${tentativa}`;
  }

  const landingPage = await prisma.landingPage.create({
    data: {
      slug,
      titulo: typeof titulo === "string" ? titulo.trim().slice(0, 255) : null,
      descricao: typeof descricao === "string" ? descricao.trim().slice(0, 5000) : null,
      cta: typeof cta === "string" ? cta.trim().slice(0, 100) : null,
      status: status === "publicada" ? "publicada" : "rascunho",
      imovelId,
      imobiliariaId: sessao.imobiliariaId
    }
  });

  return NextResponse.json({ landingPage }, { status: 201 });
}
