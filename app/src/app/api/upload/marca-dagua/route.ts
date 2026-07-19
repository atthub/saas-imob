import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterSessaoAtual } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { caminhoUploads } from "@/lib/watermark";

// POST /api/upload/marca-dagua -> envia a imagem usada como marca d'água
// (pode ser a logo da imobiliária ou qualquer outra imagem escolhida) e já
// salva a referência em Imobiliaria.marcaDaguaUrl.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar configurações." }, { status: 403 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (!arquivo.type?.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem (PNG ou JPG)." }, { status: 400 });
  }

  const extensao = path.extname(arquivo.name) || ".png";
  const nomeArquivo = `marca-dagua-${Date.now()}${extensao}`;

  const pastaTenant = caminhoUploads(sessao.imobiliariaId, "config");
  await fs.mkdir(pastaTenant, { recursive: true });

  const caminhoDestino = path.join(pastaTenant, nomeArquivo);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(caminhoDestino, buffer);

  const urlPublica = `/uploads/${sessao.imobiliariaId}/config/${nomeArquivo}`;

  await prisma.imobiliaria.update({
    where: { id: sessao.imobiliariaId },
    data: { marcaDaguaUrl: urlPublica }
  });

  return NextResponse.json({ marcaDaguaUrl: urlPublica });
}
