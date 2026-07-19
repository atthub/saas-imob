import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { obterImobiliariaAtual } from "@/lib/tenant";

async function exigirSuperAdmin() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "SUPER_ADMIN") {
    return null;
  }
  return sessao;
}

export async function GET() {
  const sessao = await exigirSuperAdmin();
  if (!sessao) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) {
    return NextResponse.json({ erro: "Imobiliária não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    funcionalidades: {
      landingPagesHabilitado: imobiliaria?.landingPagesHabilitado ?? false,
      comissoesHabilitado: imobiliaria?.comissoesHabilitado ?? false
    }
  });
}

export async function PUT(request: NextRequest) {
  const sessao = await exigirSuperAdmin();
  if (!sessao) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) {
    return NextResponse.json({ erro: "Imobiliária não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const landingPagesHabilitado = Boolean(body.landingPagesHabilitado);
  const comissoesHabilitado = Boolean(body.comissoesHabilitado);

  await prisma.imobiliaria.update({
    where: { id: imobiliaria.id },
    data: { landingPagesHabilitado, comissoesHabilitado }
  });

  return NextResponse.json({
    funcionalidades: { landingPagesHabilitado, comissoesHabilitado }
  });
}
