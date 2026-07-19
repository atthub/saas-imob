import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { caminhoUploads } from "@/lib/watermark";

type Params = { params: { id: string } };

// DELETE /api/fotos/[id] -> remove a foto (registro + arquivos no disco),
// garantindo que ela pertence a um imóvel da imobiliária da sessão atual.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const foto = await prisma.foto.findFirst({
    where: { id: params.id, imovel: { imobiliariaId: sessao.imobiliariaId } }
  });

  if (!foto) {
    return NextResponse.json({ erro: "Foto não encontrada." }, { status: 404 });
  }

  await prisma.foto.delete({ where: { id: foto.id } });

  // Se essa foto era a capa, promove a próxima (menor "ordem") a capa.
  const restantes = await prisma.foto.findMany({
    where: { imovelId: foto.imovelId },
    orderBy: { ordem: "asc" }
  });
  if (foto.capa && restantes.length > 0) {
    await prisma.foto.update({ where: { id: restantes[0].id }, data: { capa: true } });
  }

  // Tenta remover os arquivos físicos; se não existirem mais, ignora.
  for (const urlRelativa of [foto.url, foto.urlOriginal]) {
    if (!urlRelativa) continue;
    try {
      const partes = urlRelativa.replace(/^\/?uploads\//, "").split("/");
      await fs.unlink(caminhoUploads(...partes));
    } catch {
      // arquivo já não existe ou caminho inválido — não bloqueia a exclusão
    }
  }

  return NextResponse.json({ ok: true });
}
