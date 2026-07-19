import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterSessaoAtual } from "@/lib/session";
import { caminhoUploads } from "@/lib/watermark";

// POST /api/upload/banner -> envia a imagem de um banner do slider da hero.
// Não aplica marca d'água (são fotos institucionais da imobiliária, não de
// imóveis), só salva o arquivo e devolve a URL pública.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar banners." }, { status: 403 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (!arquivo.type?.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem (PNG ou JPG)." }, { status: 400 });
  }

  const extensao = path.extname(arquivo.name) || ".jpg";
  const nomeArquivo = `banner-${Date.now()}${extensao}`;

  const pastaTenant = caminhoUploads(sessao.imobiliariaId, "banners");
  await fs.mkdir(pastaTenant, { recursive: true });

  const caminhoDestino = path.join(pastaTenant, nomeArquivo);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(caminhoDestino, buffer);

  const urlPublica = `/uploads/${sessao.imobiliariaId}/banners/${nomeArquivo}`;

  return NextResponse.json({ url: urlPublica });
}
