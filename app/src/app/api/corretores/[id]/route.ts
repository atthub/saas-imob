import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { corretorSchema } from "@/lib/validators/corretor";
import { registrarAuditoria } from "@/lib/auditoria";

function podeGerenciarCorretores(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// PUT /api/corretores/[id] -> atualiza dados de um corretor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarCorretores(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const corretor = await prisma.corretor.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!corretor) {
    return NextResponse.json({ erro: "Corretor não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = corretorSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  const atualizado = await prisma.corretor.update({
    where: { id: params.id },
    data: {
      nome: dados.nome,
      telefone: dados.telefone,
      whatsapp: dados.whatsapp || null,
      email: dados.email || null,
      creci: dados.creci || null,
      ativo: dados.ativo
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "CORRETOR_ATUALIZADO",
      entidade: "corretor",
      entidadeId: params.id,
      detalhes: { nome: corretor.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true, corretor: atualizado });
}

// DELETE /api/corretores/[id] -> remove ou desativa um corretor.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarCorretores(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const corretor = await prisma.corretor.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    include: { _count: { select: { leads: true } } }
  });
  if (!corretor) {
    return NextResponse.json({ erro: "Corretor não encontrado." }, { status: 404 });
  }

  if (corretor._count.leads > 0) {
    await prisma.corretor.update({ where: { id: params.id }, data: { ativo: false } });
    if (sessao.papel !== "SUPER_ADMIN") {
      registrarAuditoria({
        imobiliariaId: sessao.imobiliariaId,
        usuarioId: sessao.usuarioId,
        usuarioNome: sessao.nome,
        acao: "CORRETOR_DESATIVADO",
        entidade: "corretor",
        entidadeId: params.id,
        detalhes: { nome: corretor.nome },
        ip: request.headers.get("x-forwarded-for") || null
      });
    }
    return NextResponse.json({
      ok: true,
      desativado: true,
      aviso: "Este corretor já tem leads direcionados e por isso foi apenas desativado, não excluído."
    });
  }

  await prisma.corretor.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "CORRETOR_EXCLUIDO",
      entidade: "corretor",
      entidadeId: params.id,
      detalhes: { nome: corretor.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}
