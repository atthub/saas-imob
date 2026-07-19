import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";

// GET /api/proprietarios -> lista os proprietários cadastrados na imobiliária,
// com a contagem de imóveis vinculados a cada um.
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") || undefined;

  const proprietarios = await prisma.proprietario.findMany({
    where: {
      imobiliariaId: sessao.imobiliariaId,
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca } },
              { telefone: { contains: busca } },
              { email: { contains: busca } }
            ]
          }
        : {})
    },
    include: { _count: { select: { imoveis: true } } },
    orderBy: { nome: "asc" }
  });

  return NextResponse.json({ proprietarios });
}

// POST /api/proprietarios -> cadastra um novo proprietário manualmente
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para cadastrar proprietários." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.nome !== "string" || !body.nome.trim()) {
    return NextResponse.json({ erro: "Informe o nome do proprietário." }, { status: 400 });
  }
  if (typeof body.telefone !== "string" || !body.telefone.trim()) {
    return NextResponse.json({ erro: "Informe o telefone do proprietário." }, { status: 400 });
  }

  const proprietario = await prisma.proprietario.create({
    data: {
      nome: body.nome.trim(),
      telefone: body.telefone.trim(),
      email: body.email?.trim() || null,
      observacoes: body.observacoes?.trim() || null,
      imobiliariaId: sessao.imobiliariaId
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "PROPRIETARIO_CRIADO",
      entidade: "proprietario",
      entidadeId: proprietario.id,
      detalhes: { nome: proprietario.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ proprietario }, { status: 201 });
}
