import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/session";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { getConfigs, setConfig } from "@/lib/config";

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

  const cfgs = await getConfigs(imobiliaria.id, ["landingPagesHabilitado", "comissoesHabilitado"]);

  return NextResponse.json({
    funcionalidades: {
      landingPagesHabilitado: cfgs["landingPagesHabilitado"] === "true",
      comissoesHabilitado:    cfgs["comissoesHabilitado"]    === "true",
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
  const comissoesHabilitado    = Boolean(body.comissoesHabilitado);

  await setConfig(imobiliaria.id, "landingPagesHabilitado", landingPagesHabilitado);
  await setConfig(imobiliaria.id, "comissoesHabilitado",    comissoesHabilitado);

  return NextResponse.json({
    funcionalidades: { landingPagesHabilitado, comissoesHabilitado }
  });
}
