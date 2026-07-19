import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { hashSenha } from "@/lib/auth";
import { criarUsuarioSchema } from "@/lib/validators/usuario";
import { permissoesPadrao } from "@/lib/permissoes";
import { registrarAuditoria } from "@/lib/auditoria";

function podeGerenciarUsuarios(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// GET /api/usuarios -> lista os usuários da imobiliária do administrador logado
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarUsuarios(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, email: true, papel: true, permissoes: true, criadoEm: true }
  });

  return NextResponse.json({ usuarios });
}

// POST /api/usuarios -> cria um novo usuário (corretor ou administrador) já com permissões
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarUsuarios(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = criarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe um usuário com esse e-mail." }, { status: 409 });
  }

  const senhaHash = await hashSenha(dados.senha);
  const permissoes = dados.permissoes.length > 0 ? dados.permissoes : permissoesPadrao(dados.papel);

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      papel: dados.papel,
      permissoes,
      imobiliariaId: sessao.imobiliariaId
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "USUARIO_CRIADO",
      entidade: "usuario",
      entidadeId: usuario.id,
      detalhes: { nome: dados.nome, papel: dados.papel },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true, usuario: { id: usuario.id } }, { status: 201 });
}
