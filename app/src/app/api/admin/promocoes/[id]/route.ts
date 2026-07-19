import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const titulo = String(body.titulo || "").trim().slice(0, 191);
  if (!titulo) return NextResponse.json({ erro: "Título obrigatório." }, { status: 400 });

  const tiposLinkValidos = ["imovel", "externo"];

  // Campos novos (imagemUrlMobile, tipoLink, codigoImovel, captarLeads) são omitidos do updateMany()
  // porque o Prisma Client do servidor não os conhece — serão atualizados via $executeRaw abaixo.
  const resultado = await prisma.promocao.updateMany({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    data: {
      titulo,
      subtitulo:  body.subtitulo ? String(body.subtitulo).trim().slice(0, 191) : null,
      descricao:  body.descricao ? String(body.descricao).trim() : null,
      imagemUrl:  body.imagemUrl ? String(body.imagemUrl).trim() : null,
      link:       body.link      ? String(body.link).trim()      : null,
      ordem:      typeof body.ordem === "number"  ? body.ordem : 0,
      ativo:      typeof body.ativo === "boolean" ? body.ativo  : true,
      dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
      dataFim:    body.dataFim    ? new Date(body.dataFim)    : null,
    }
  });

  // Atualiza campos novos via SQL direto (bypass do DMMF desatualizado do servidor)
  try {
    const imagemUrlMobile = body.imagemUrlMobile ? String(body.imagemUrlMobile).trim() : null;
    const tipoLink        = tiposLinkValidos.includes(body.tipoLink) ? String(body.tipoLink) : null;
    const codigoImovel    = body.codigoImovel ? String(body.codigoImovel).trim().slice(0, 50) : null;
    const captarLeadsVal  = typeof body.captarLeads === "boolean" ? (body.captarLeads ? 1 : 0) : 0;
    await prisma.$executeRaw`
      UPDATE promocoes
      SET imagemUrlMobile = ${imagemUrlMobile},
          tipoLink        = ${tipoLink},
          codigoImovel    = ${codigoImovel},
          captarLeads     = ${captarLeadsVal}
      WHERE id = ${params.id} AND imobiliariaId = ${sessao.imobiliariaId}
    `;
  } catch {
    // Colunas ainda não existem no banco — ignora
  }

  return NextResponse.json({ ok: true, count: resultado.count });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  await prisma.promocao.deleteMany({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });

  return NextResponse.json({ ok: true });
}
