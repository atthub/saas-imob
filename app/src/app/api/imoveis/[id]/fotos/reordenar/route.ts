import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

type Params = { params: { id: string } };

// PATCH /api/imoveis/[id]/fotos/reordenar
// Recebe { ordem: string[] } com os ids das fotos na nova ordem desejada.
// A primeira foto da lista passa a ser a capa.
export async function PATCH(request: NextRequest, { params }: Params) {
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

  const body = await request.json().catch(() => null);
  const ordemIds: unknown = body?.ordem;
  if (!Array.isArray(ordemIds) || ordemIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ erro: "Envie a lista de ids na nova ordem." }, { status: 400 });
  }

  // Garante que todos os ids pertencem mesmo a este imóvel, antes de gravar.
  const fotosDoImovel = await prisma.foto.findMany({ where: { imovelId: params.id } });
  const idsValidos = new Set(fotosDoImovel.map((f) => f.id));
  if (ordemIds.length !== fotosDoImovel.length || ordemIds.some((id) => !idsValidos.has(id as string))) {
    return NextResponse.json({ erro: "Lista de fotos inválida para este imóvel." }, { status: 400 });
  }

  await prisma.$transaction(
    (ordemIds as string[]).map((id, index) =>
      prisma.foto.update({
        where: { id },
        data: { ordem: index, capa: index === 0 }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
