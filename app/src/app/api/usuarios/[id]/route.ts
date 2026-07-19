import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { editarUsuarioSchema } from "@/lib/validators/usuario";
import { registrarAuditoria } from "@/lib/auditoria";

type Params = { params: { id: string } };

function podeGerenciarUsuarios(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// PUT /api/usuarios/[id] -> atualiza nome, papel e permissões de um usuário
export async function PUT(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarUsuarios(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const usuarioAtual = await prisma.usuario.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!usuarioAtual) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = editarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  await prisma.usuario.update({
    where: { id: params.id },
    data: { nome: dados.nome, papel: dados.papel, permissoes: dados.permissoes }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "USUARIO_ATUALIZADO",
      entidade: "usuario",
      entidadeId: params.id,
      detalhes: { nome: dados.nome, papel: dados.papel },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/usuarios/[id] -> remove o acesso de um usuário
export async function DELETE(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarUsuarios(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  if (params.id === sessao.usuarioId) {
    return NextResponse.json({ erro: "Você não pode excluir seu próprio usuário." }, { status: 400 });
  }

  const usuarioAtual = await prisma.usuario.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!usuarioAtual) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  // Se o usuário for também um Corretor, desvincula sem apagar o Corretor
  // (leads, comissões e histórico permanecem intactos)
  await prisma.corretor.updateMany({
    where: { usuarioId: params.id },
    data: { usuarioId: null }
  });

  await prisma.usuario.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "USUARIO_EXCLUIDO",
      entidade: "usuario",
      entidadeId: params.id,
      detalhes: { nome: usuarioAtual.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}
