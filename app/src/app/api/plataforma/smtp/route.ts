import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// Configuração de SMTP é exclusiva do SUPER_ADMIN (dono do SaaS) — é global
// da plataforma, não de uma imobiliária específica, então nenhum ADMIN/
// CORRETOR de imobiliária pode ler ou alterar (a senha SMTP nunca deve
// vazar para o painel de uma imobiliária comum).
async function exigirSuperAdmin() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "SUPER_ADMIN") {
    return null;
  }
  return sessao;
}

// GET /api/plataforma/smtp -> configuração SMTP atual (a senha é mascarada
// na resposta: o front-end mostra "********" e só envia uma senha nova se o
// usuário realmente digitar uma diferente).
export async function GET() {
  const sessao = await exigirSuperAdmin();
  if (!sessao) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const config = await prisma.configuracaoPlataforma.findUnique({ where: { id: "default" } });

  return NextResponse.json({
    config: {
      smtpHost: config?.smtpHost || "",
      smtpPorta: config?.smtpPorta || null,
      smtpUsuario: config?.smtpUsuario || "",
      smtpSenhaPreenchida: Boolean(config?.smtpSenha),
      smtpRemetente: config?.smtpRemetente || "",
      smtpSeguro: config?.smtpSeguro ?? true
    }
  });
}

// PUT /api/plataforma/smtp -> cria/atualiza a linha "default" (upsert, já
// que essa tabela nunca tem mais de uma linha). Campo smtpSenha: se vier
// vazio/ausente, mantém a senha já salva (não apaga por engano quando o
// usuário só ajusta outro campo sem reabrir a senha).
export async function PUT(request: NextRequest) {
  const sessao = await exigirSuperAdmin();
  if (!sessao) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const smtpHost = typeof body.smtpHost === "string" ? body.smtpHost.trim().slice(0, 255) : "";
  const smtpPorta = typeof body.smtpPorta === "number" && body.smtpPorta > 0 ? Math.round(body.smtpPorta) : null;
  const smtpUsuario = typeof body.smtpUsuario === "string" ? body.smtpUsuario.trim().slice(0, 255) : "";
  const smtpRemetente = typeof body.smtpRemetente === "string" ? body.smtpRemetente.trim().slice(0, 255) : "";
  const smtpSeguro = typeof body.smtpSeguro === "boolean" ? body.smtpSeguro : true;
  const novaSenha = typeof body.smtpSenha === "string" ? body.smtpSenha : "";

  const existente = await prisma.configuracaoPlataforma.findUnique({ where: { id: "default" } });

  const config = await prisma.configuracaoPlataforma.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      smtpHost,
      smtpPorta,
      smtpUsuario,
      smtpSenha: novaSenha || null,
      smtpRemetente,
      smtpSeguro
    },
    update: {
      smtpHost,
      smtpPorta,
      smtpUsuario,
      ...(novaSenha ? { smtpSenha: novaSenha } : {}),
      smtpRemetente,
      smtpSeguro
    }
  });

  return NextResponse.json({
    config: {
      smtpHost: config.smtpHost || "",
      smtpPorta: config.smtpPorta || null,
      smtpUsuario: config.smtpUsuario || "",
      smtpSenhaPreenchida: Boolean(config.smtpSenha),
      smtpRemetente: config.smtpRemetente || "",
      smtpSeguro: config.smtpSeguro
    },
    senhaMantida: !novaSenha && Boolean(existente?.smtpSenha)
  });
}
