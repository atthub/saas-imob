import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const promocoes = await prisma.$queryRaw<any[]>`
    SELECT id, imobiliariaId, titulo, subtitulo, descricao,
           imagemUrl, imagemUrlMobile, tipoLink, codigoImovel, link,
           captarLeads, ordem, ativo, dataInicio, dataFim, criadoEm, atualizadoEm
    FROM promocoes
    WHERE imobiliariaId = ${sessao.imobiliariaId}
    ORDER BY ordem ASC
  `;

  // Normaliza tipos booleanos (MySQL retorna 0/1)
  const resultado = promocoes.map((p: any) => ({
    ...p,
    captarLeads: p.captarLeads === 1 || p.captarLeads === true,
    ativo:       p.ativo       === 1 || p.ativo       === true,
  }));

  return NextResponse.json({ promocoes: resultado });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (sessao.papel === "CORRETOR") return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const titulo = String(body.titulo || "").trim().slice(0, 191);
  if (!titulo) return NextResponse.json({ erro: "Título obrigatório." }, { status: 400 });

  const tiposLinkValidos = ["imovel", "externo"];

  // Campos novos (imagemUrlMobile, tipoLink, codigoImovel, captarLeads) são omitidos do create()
  // porque o Prisma Client do servidor não os conhece — serão atualizados via $executeRaw abaixo.
  const promocao = await prisma.promocao.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
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
      WHERE id = ${promocao.id}
    `;
  } catch {
    // Colunas ainda não existem no banco — ignora
  }

  return NextResponse.json({ promocao }, { status: 201 });
}
