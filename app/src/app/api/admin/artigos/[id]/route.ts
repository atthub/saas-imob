import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const artigo = await prisma.artigo.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });

  if (!artigo) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ artigo });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const titulo = String(body.titulo || "").trim();
  if (!titulo) return NextResponse.json({ erro: "Título obrigatório." }, { status: 400 });

  const slug = body.slug
    ? String(body.slug).trim().toLowerCase().replace(/\s+/g, "-").slice(0, 100)
    : titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 100);

  // Verifica conflito de slug com outro artigo
  const conflito = await prisma.artigo.findFirst({
    where: { imobiliariaId: sessao.imobiliariaId, slug, NOT: { id: params.id } }
  });
  if (conflito) return NextResponse.json({ erro: "Já existe um artigo com esse slug." }, { status: 409 });

  const artigo = await prisma.artigo.updateMany({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    data: {
      titulo,
      slug,
      resumo: body.resumo ? String(body.resumo).trim() : null,
      conteudo: String(body.conteudo || "").trim(),
      imagemCapaUrl: body.imagemCapaUrl ? String(body.imagemCapaUrl).trim() : null,
      categoria: body.categoria ? String(body.categoria).trim().slice(0, 100) : null,
      autor: body.autor ? String(body.autor).trim().slice(0, 100) : null,
      ativo: typeof body.ativo === "boolean" ? body.ativo : true,
      metaDescricao: body.metaDescricao ? String(body.metaDescricao).trim().slice(0, 160) : null,
      publicadoEm: body.publicadoEm ? new Date(body.publicadoEm) : undefined,
    }
  });

  return NextResponse.json({ ok: true, count: artigo.count });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  await prisma.artigo.deleteMany({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });

  return NextResponse.json({ ok: true });
}
