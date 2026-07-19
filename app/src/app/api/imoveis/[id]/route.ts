import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { imovelSchema } from "@/lib/validators/imovel";
import { registrarAuditoria } from "@/lib/auditoria";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const imovel = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    include: {
      fotos: { orderBy: { ordem: "asc" } },
      videos: { orderBy: { ordem: "asc" } },
      caracteristicas: { include: { caracteristica: true } },
      condominioCaracteristicas: { include: { caracteristica: true } },
      cidade: true,
      bairro: true
    }
  });

  if (!imovel) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ imovel });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const imovelAtual = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!imovelAtual) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = imovelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const dados = parsed.data;

  // Verificar duplicidade de código manual (excluindo o próprio imóvel)
  if (!dados.codigoAutomatico && dados.codigo) {
    const conflito = await prisma.imovel.findFirst({
      where: {
        imobiliariaId: sessao.imobiliariaId,
        codigo: dados.codigo,
        NOT: { id: params.id }
      }
    });
    if (conflito) {
      return NextResponse.json({ erro: "Já existe um imóvel com esse código." }, { status: 409 });
    }
  }

  try {
    await prisma.$transaction([
      prisma.imovelCaracteristica.deleteMany({ where: { imovelId: params.id } }),
      prisma.imovelCondominioCaracteristica.deleteMany({ where: { imovelId: params.id } }),
      prisma.imovel.update({
        where: { id: params.id },
        data: {
          codigo: dados.codigoAutomatico ? imovelAtual.codigo : (dados.codigo as string),
          codigoAutomatico: dados.codigoAutomatico,
          titulo: dados.titulo,
          descricao: dados.descricao,
          tipo: dados.tipo,
          finalidade: dados.finalidade,
          status: dados.status,
          valorVenda: dados.valorVenda ?? null,
          valorLocacao: dados.valorLocacao ?? null,
          valorCondominio: dados.valorCondominio ?? null,
          valorIptu: dados.valorIptu ?? null,
          areaTotal: dados.areaTotal ?? null,
          areaConstruida: dados.areaConstruida ?? null,
          quartos: dados.quartos ?? null,
          suites: dados.suites ?? null,
          banheiros: dados.banheiros ?? null,
          vagasGaragem: dados.vagasGaragem ?? null,
          endereco: dados.endereco,
          numero: dados.numero,
          complemento: dados.complemento,
          cep: dados.cep,
          cidadeId: dados.cidadeId || null,
          bairroId: dados.bairroId || null,
          latitude: dados.latitude ?? null,
          longitude: dados.longitude ?? null,
          exibirMapa: dados.exibirMapa,
          destaque: dados.destaque,
          proprietarioNome: dados.proprietarioNome || null,
          proprietarioTelefone: dados.proprietarioTelefone || null,
          proprietarioEmail: dados.proprietarioEmail || null,
          proprietarioObs: dados.proprietarioObs || null,
          locatarioNome: dados.locatarioNome || null,
          locatarioTelefone: dados.locatarioTelefone || null,
          locatarioEmail: dados.locatarioEmail || null,
          locatarioObs: dados.locatarioObs || null,
          contratoInicio: dados.contratoInicio ?? null,
          contratoFim: dados.contratoFim ?? null,
          caracteristicas: {
            create: dados.caracteristicaIds.map((id) => ({ caracteristicaId: id }))
          },
          condominioCaracteristicas: {
            create: dados.condominioCaracteristicaIds.map((id) => ({ caracteristicaId: id }))
          }
        }
      })
    ]);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "P2002") {
      return NextResponse.json({ erro: "Já existe um imóvel com esse código." }, { status: 409 });
    }
    console.error("Erro ao salvar imóvel:", err);
    return NextResponse.json({ erro: "Não foi possível salvar o imóvel. Tente novamente." }, { status: 500 });
  }

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "IMOVEL_ATUALIZADO",
      entidade: "imovel",
      entidadeId: params.id,
      detalhes: { titulo: imovelAtual.titulo, codigo: imovelAtual.codigo },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/imoveis/[id] -> atualização parcial rápida (ex: alternar destaque)
export async function PATCH(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const imovelAtual = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!imovelAtual) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  const body = await request.json();

  if (typeof body.destaque !== "boolean") {
    return NextResponse.json({ erro: "Campo 'destaque' deve ser true ou false." }, { status: 400 });
  }

  const imovel = await prisma.imovel.update({
    where: { id: params.id },
    data: { destaque: body.destaque }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "IMOVEL_ATUALIZADO",
      entidade: "imovel",
      entidadeId: params.id,
      detalhes: { destaque: body.destaque },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ imovel });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const imovel = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!imovel) {
    return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
  }

  await prisma.imovel.delete({ where: { id: params.id } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "IMOVEL_EXCLUIDO",
      entidade: "imovel",
      entidadeId: params.id,
      detalhes: { titulo: imovel.titulo, codigo: imovel.codigo },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true });
}
