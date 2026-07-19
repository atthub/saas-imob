import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { hashSenha, verificarSenha } from "@/lib/auth";
import { trocarSenhaSchema } from "@/lib/validators/usuario";

// POST /api/auth/trocar-senha -> permite que o usuário logado troque a própria senha
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = trocarSenhaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { senhaAtual, novaSenha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuarioId } });
  if (!usuario) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  const senhaCorreta = await verificarSenha(senhaAtual, usuario.senhaHash);
  if (!senhaCorreta) {
    return NextResponse.json({ erro: "A senha atual informada está incorreta." }, { status: 401 });
  }

  const novaSenhaHash = await hashSenha(novaSenha);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: novaSenhaHash }
  });

  return NextResponse.json({ ok: true });
}
