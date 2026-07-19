import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { token, novaSenha } = await request.json();

  if (!token || !novaSenha) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  if (novaSenha.length < 6) {
    return NextResponse.json(
      { erro: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      resetToken: token,
      resetTokenExpira: { gt: new Date() }
    }
  });

  if (!usuario) {
    return NextResponse.json(
      { erro: "Link inválido ou expirado. Solicite um novo link." },
      { status: 400 }
    );
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senhaHash: await hashSenha(novaSenha),
      resetToken: null,
      resetTokenExpira: null
    }
  });

  return NextResponse.json({ ok: true });
}
