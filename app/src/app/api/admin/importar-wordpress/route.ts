import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/session";
import { consultarProgresso, importarLote } from "@/lib/importacaoWordpress";

function autorizado(papel?: string) {
  return papel === "SUPER_ADMIN" || papel === "ADMIN";
}

// GET -> progresso atual (quantos anúncios existem no WordPress, quantos já
// foram trazidos para este tenant, quantos faltam).
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !autorizado(sessao.papel)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

  try {
    const progresso = await consultarProgresso(sessao.imobiliariaId);
    return NextResponse.json(progresso);
  } catch (erro: any) {
    return NextResponse.json({ erro: erro?.message || "Falha ao consultar o WordPress." }, { status: 500 });
  }
}

// POST -> importa o próximo lote (padrão: 15 anúncios por chamada, para não
// passar do tempo limite de requisição da hospedagem). Chame de novo até
// "restantes" chegar a 0.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !autorizado(sessao.papel)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const quantidade = Number(body?.quantidade) > 0 ? Number(body.quantidade) : 15;

  try {
    const resultado = await importarLote(sessao.imobiliariaId, quantidade);
    return NextResponse.json(resultado);
  } catch (erro: any) {
    return NextResponse.json({ erro: erro?.message || "Falha ao importar este lote." }, { status: 500 });
  }
}
