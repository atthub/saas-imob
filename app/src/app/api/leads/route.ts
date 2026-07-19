import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/validators/lead";
import { obterSessaoAtual } from "@/lib/session";
import { verificarTurnstile } from "@/lib/turnstile";
import { enviarEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// POST /api/leads -> formulário público "tenho interesse" em um imóvel.
// Protegido por Cloudflare Turnstile quando TURNSTILE_SECRET_KEY está configurada.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const dados = parsed.data;

  // Verificação anti-spam (pulada se TURNSTILE_SECRET_KEY não configurada)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const captchaValido = await verificarTurnstile(dados.turnstileToken || "", ip);
  if (!captchaValido) {
    return NextResponse.json(
      { erro: "Não foi possível confirmar que você não é um robô. Tente novamente." },
      { status: 400 }
    );
  }

  // promocaoId pode vir fora do schema Zod (campo extra no body)
  const rawBody = body as Record<string, unknown>;
  const promocaoId = typeof rawBody.promocaoId === "string" && rawBody.promocaoId ? rawBody.promocaoId : undefined;
  const origemLead = promocaoId ? "promocao" : (dados.imovelId ? "site" : "site");

  const lead = await prisma.lead.create({
    data: {
      nome: dados.nome,
      telefone: dados.telefone,
      cidade: dados.cidade,
      mensagem: dados.mensagem,
      imovelId: dados.imovelId || undefined,
      imobiliariaId: dados.imobiliariaId,
      // promocaoId omitido: campo novo — Prisma Client do servidor não o conhece
      origem: origemLead
    }
  });

  // Atualiza promocaoId via SQL direto (campo novo, bypass do DMMF desatualizado do servidor)
  if (promocaoId) {
    try {
      await prisma.$executeRaw`UPDATE leads SET promocaoId = ${promocaoId} WHERE id = ${lead.id}`;
    } catch {
      // Coluna ainda não existe no banco em produção — ignora
    }
  }

  // Notificação por e-mail para os ADMINs da imobiliária (silencioso, sem bloquear a resposta)
  notificarNovoLead(dados.imobiliariaId, lead).catch((err) => {
    console.error("[notificarNovoLead] Erro ao enviar e-mail de lead:", err);
  });

  return NextResponse.json({ ok: true, lead }, { status: 201 });
}

// Envia e-mail de notificação para todos os ADMINs da imobiliária
async function notificarNovoLead(
  imobiliariaId: string,
  lead: { nome: string; telefone: string; mensagem?: string | null }
) {
  const admins = await prisma.usuario.findMany({
    where: { imobiliariaId, papel: "ADMIN" },
    select: { email: true, nome: true }
  });

  const imobiliaria = await prisma.imobiliaria.findUnique({
    where: { id: imobiliariaId },
    select: { nome: true }
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  for (const admin of admins) {
    await enviarEmail({
      para: admin.email,
      assunto: `📩 Novo lead recebido — ${lead.nome}`,
      html: `
        <h2>Novo lead na plataforma!</h2>
        <p>Olá, ${admin.nome}! Um novo lead chegou para <strong>${imobiliaria?.nome || "sua imobiliária"}</strong>.</p>
        <hr />
        <p><strong>Nome:</strong> ${lead.nome}</p>
        <p><strong>Telefone:</strong> ${lead.telefone}</p>
        ${lead.mensagem ? `<p><strong>Mensagem:</strong> ${lead.mensagem}</p>` : ""}
        <hr />
        <p><a href="${siteUrl}/admin/leads">Acessar painel de leads →</a></p>
      `
    }).catch((err) => {
      console.error(`[notificarNovoLead] Falha ao enviar para ${admin.email}:`, err);
    });
  }
}

// GET /api/leads -> lista leads da imobiliária logada (painel admin)
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const leads = await prisma.lead.findMany({
    where: {
      imobiliariaId: sessao.imobiliariaId,
      ...(status ? { status: status as any } : {})
    },
    include: { imovel: true, corretor: true },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ leads });
}
