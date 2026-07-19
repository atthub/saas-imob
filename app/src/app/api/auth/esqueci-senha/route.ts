import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ erro: "Informe o e-mail." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario) {
    const token = crypto.randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetToken: token, resetTokenExpira: expira }
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const link = `${siteUrl}/admin/redefinir-senha?token=${token}`;

    try {
      await enviarEmail({
        para: email,
        assunto: "Redefinição de senha — Vitrine Imob",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <img src="https://imob.attitudehub.com.br/logo-vitrine-imob.png"
                 alt="Vitrine Imob" style="height:60px;margin-bottom:24px" />
            <h2 style="color:#1a1a1a">Redefinição de senha</h2>
            <p>Olá, <strong>${usuario.nome}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.
               Clique no botão abaixo para criar uma nova senha.
               O link expira em <strong>1 hora</strong>.</p>
            <a href="${link}"
               style="display:inline-block;background:#d97706;color:#fff;
                      padding:12px 24px;border-radius:6px;text-decoration:none;
                      font-weight:600;margin:16px 0">
              Redefinir minha senha
            </a>
            <p style="color:#666;font-size:13px">
              Se você não solicitou a redefinição, ignore este e-mail.
            </p>
          </div>
        `
      });
    } catch (emailErro) {
      // Log do erro de e-mail sem derrubar a requisição
      console.error("[esqueci-senha] Falha ao enviar e-mail:", emailErro);
    }
  }

  return NextResponse.json({
    ok: true,
    mensagem: "Se o e-mail estiver cadastrado, você receberá as instruções em breve."
  });
}
