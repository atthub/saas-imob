import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSenha, gerarTokenSessao, SESSION_COOKIE_NAME } from "@/lib/auth";
import { permissoesPadrao } from "@/lib/permissoes";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(request: NextRequest) {
  const { email, senha } = await request.json();

  if (!email || !senha) {
    return NextResponse.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) {
    return NextResponse.json({ erro: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const permissoes = Array.isArray(usuario.permissoes)
    ? (usuario.permissoes as string[])
    : permissoesPadrao(usuario.papel);

  const token = await gerarTokenSessao({
    usuarioId: usuario.id,
    imobiliariaId: usuario.imobiliariaId,
    papel: usuario.papel,
    nome: usuario.nome,
    permissoes
  });

  // Registra login na auditoria (não bloqueia a resposta em caso de erro)
  registrarAuditoria({
    imobiliariaId: usuario.imobiliariaId,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    acao: "LOGIN",
    ip: request.headers.get("x-forwarded-for") || null
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
