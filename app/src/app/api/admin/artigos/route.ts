import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const artigos = await prisma.artigo.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { publicadoEm: "desc" },
    select: {
      id: true, titulo: true, slug: true, categoria: true,
      ativo: true, publicadoEm: true, imagemCapaUrl: true
    }
  });

  return NextResponse.json({ artigos });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const titulo = String(body.titulo || "").trim();
  if (!titulo) return NextResponse.json({ erro: "Título obrigatório." }, { status: 400 });

  const slugBase = body.slug ? String(body.slug).trim().toLowerCase().replace(/\s+/g, "-") : gerarSlug(titulo);

  // Garante slug único dentro da imobiliária
  let slug = slugBase;
  let tentativa = 0;
  while (true) {
    const existe = await prisma.artigo.findUnique({
      where: { imobiliariaId_slug: { imobiliariaId: sessao.imobiliariaId, slug } }
    });
    if (!existe) break;
    tentativa++;
    slug = `${slugBase}-${tentativa}`;
  }

  const artigo = await prisma.artigo.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      titulo,
      slug,
      resumo: body.resumo ? String(body.resumo).trim() : null,
      conteudo: String(body.conteudo || "").trim(),
      imagemCapaUrl: body.imagemCapaUrl ? String(body.imagemCapaUrl).trim() : null,
      categoria: body.categoria ? String(body.categoria).trim().slice(0, 100) : null,
      autor: body.autor ? String(body.autor).trim().slice(0, 100) : null,
      ativo: typeof body.ativo === "boolean" ? body.ativo : true,
      metaDescricao: body.metaDescricao ? String(body.metaDescricao).trim().slice(0, 160) : null,
      publicadoEm: body.publicadoEm ? new Date(body.publicadoEm) : new Date(),
    }
  });

  return NextResponse.json({ artigo }, { status: 201 });
}
