import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/session";
import { enviarEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mensagem = typeof body.mensagem === "string" ? body.mensagem.trim() : "";
  if (!mensagem || mensagem.length < 10) {
    return NextResponse.json({ erro: "Descreva sua sugestão com pelo menos 10 caracteres." }, { status: 400 });
  }

  try {
    await enviarEmail({
      para: "suporte@attitudehub.com.br",
      assunto: `💡 Nova sugestão — ${sessao.nome || "Usuário"}`,
      html: `
        <h2>Nova sugestão recebida</h2>
        <p><strong>Usuário:</strong> ${sessao.nome || "—"}</p>
        <p><strong>Imobiliária ID:</strong> ${sessao.imobiliariaId || "SUPER_ADMIN"}</p>
        <p><strong>Papel:</strong> ${sessao.papel}</p>
        <hr />
        <p><strong>Sugestão:</strong></p>
        <p style="white-space:pre-wrap">${mensagem}</p>
      `
    });
  } catch (err) {
    console.error("Erro ao enviar sugestão por e-mail:", err);
    // Não falha para o usuário se o e-mail não foi configurado
  }

  return NextResponse.json({ ok: true });
}
