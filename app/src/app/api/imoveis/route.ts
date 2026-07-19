import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { imovelSchema } from "@/lib/validators/imovel";
import { gerarCodigoAutomatico } from "@/lib/codigoImovel";
import { registrarAuditoria } from "@/lib/auditoria";

// GET /api/imoveis -> lista imóveis da imobiliária logada (com filtros simples)
export async function GET(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") || undefined;
  const finalidade = searchParams.get("finalidade") || undefined;
  const destaqueParam = searchParams.get("destaque") || undefined;
  const statusParam = searchParams.get("status") || undefined;

  const STATUSES_VALIDOS = ["DISPONIVEL", "RESERVADO", "VENDIDO", "ALUGADO", "INATIVO"];

  const imoveis = await prisma.imovel.findMany({
    where: {
      imobiliariaId: sessao.imobiliariaId,
      ...(busca
        ? {
            OR: [
              { titulo: { contains: busca } },
              { codigo: { contains: busca } }
            ]
          }
        : {}),
      ...(finalidade ? { finalidade: finalidade as "VENDA" | "LOCACAO" } : {}),
      ...(destaqueParam ? { destaque: destaqueParam === "true" } : {}),
      ...(statusParam && STATUSES_VALIDOS.includes(statusParam)
        ? { status: statusParam as any }
        : {})
    },
    include: { fotos: { where: { capa: true }, take: 1 }, cidade: true, bairro: true },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ imoveis });
}

// POST /api/imoveis -> cria um novo imóvel
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = imovelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const dados = parsed.data;

  const codigoFinal = dados.codigoAutomatico
    ? await gerarCodigoAutomatico(sessao.imobiliariaId)
    : (dados.codigo as string);

  // Garante que código manual também seja único dentro da imobiliária
  if (!dados.codigoAutomatico) {
    const existente = await prisma.imovel.findFirst({
      where: { imobiliariaId: sessao.imobiliariaId, codigo: codigoFinal }
    });
    if (existente) {
      return NextResponse.json({ erro: "Já existe um imóvel com esse código." }, { status: 409 });
    }
  }

  const imovel = await prisma.imovel.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      codigo: codigoFinal,
      codigoAutomatico: dados.codigoAutomatico,
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      finalidade: dados.finalidade,
      status: dados.status,
      valorVenda: dados.valorVenda ?? undefined,
      valorLocacao: dados.valorLocacao ?? undefined,
      valorCondominio: dados.valorCondominio ?? undefined,
      valorIptu: dados.valorIptu ?? undefined,
      areaTotal: dados.areaTotal ?? undefined,
      areaConstruida: dados.areaConstruida ?? undefined,
      quartos: dados.quartos ?? undefined,
      suites: dados.suites ?? undefined,
      banheiros: dados.banheiros ?? undefined,
      vagasGaragem: dados.vagasGaragem ?? undefined,
      endereco: dados.endereco,
      numero: dados.numero,
      complemento: dados.complemento,
      cep: dados.cep,
      cidadeId: dados.cidadeId || undefined,
      bairroId: dados.bairroId || undefined,
      latitude: dados.latitude ?? undefined,
      longitude: dados.longitude ?? undefined,
      exibirMapa: dados.exibirMapa,
      destaque: dados.destaque,
      proprietarioNome: dados.proprietarioNome || undefined,
      proprietarioTelefone: dados.proprietarioTelefone || undefined,
      proprietarioEmail: dados.proprietarioEmail || undefined,
      proprietarioObs: dados.proprietarioObs || undefined,
      locatarioNome: dados.locatarioNome || undefined,
      locatarioTelefone: dados.locatarioTelefone || undefined,
      locatarioEmail: dados.locatarioEmail || undefined,
      locatarioObs: dados.locatarioObs || undefined,
      contratoInicio: dados.contratoInicio ?? undefined,
      contratoFim: dados.contratoFim ?? undefined,
      caracteristicas: {
        create: dados.caracteristicaIds.map((id) => ({ caracteristicaId: id }))
      },
      condominioCaracteristicas: {
        create: dados.condominioCaracteristicaIds.map((id) => ({ caracteristicaId: id }))
      }
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "IMOVEL_CRIADO",
      entidade: "imovel",
      entidadeId: imovel.id,
      detalhes: { titulo: imovel.titulo, codigo: imovel.codigo },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ imovel }, { status: 201 });
}
