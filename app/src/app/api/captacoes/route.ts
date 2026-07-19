import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { captacaoSchema } from "@/lib/validators/captacao";
import { verificarTurnstile } from "@/lib/turnstile";

// POST /api/captacoes -> formulário público "quero anunciar meu imóvel".
// Protegido por captcha (Cloudflare Turnstile) para reduzir spam/bots, já
// que não exige login. A imobiliária é resolvida pelo tenant atual do
// deploy (não confiamos em um imobiliariaId vindo do cliente).
export async function POST(request: NextRequest) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) {
    return NextResponse.json({ erro: "Site em configuração." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = captacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const dados = parsed.data;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const captchaValido = await verificarTurnstile(dados.turnstileToken, ip);
  if (!captchaValido) {
    return NextResponse.json({ erro: "Não foi possível confirmar que você não é um robô. Tente novamente." }, { status: 400 });
  }

  const captacao = await prisma.captacao.create({
    data: {
      nomeProprietario: dados.nomeProprietario,
      telefone: dados.telefone,
      email: dados.email || null,
      tipoImovel: dados.tipoImovel || null,
      finalidade: dados.finalidade || null,
      endereco: dados.endereco || null,
      cidade: dados.cidade || null,
      bairro: dados.bairro || null,
      valorPretendido: dados.valorPretendido || null,
      descricao: dados.descricao || null,
      imobiliariaId: imobiliaria.id,
      fotos: dados.fotos?.length
        ? { create: dados.fotos.map((url) => ({ url })) }
        : undefined
    }
  });

  return NextResponse.json({ ok: true, captacao }, { status: 201 });
}

// GET /api/captacoes -> lista captações recebidas, para o painel admin.
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const captacoes = await prisma.captacao.findMany({
    where: {
      imobiliariaId: sessao.imobiliariaId,
      ...(status ? { status } : {})
    },
    include: { fotos: true },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ captacoes });
}
