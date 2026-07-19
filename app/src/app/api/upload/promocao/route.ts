import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterSessaoAtual } from "@/lib/session";
import { caminhoUploads } from "@/lib/watermark";

// POST /api/upload/promocao?tipo=desktop|mobile
// Salva imagem de banner de promoção sem marca d'água.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const tipo = new URL(request.url).searchParams.get("tipo") || "desktop";

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (!arquivo.type?.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem (PNG ou JPG)." }, { status: 400 });
  }

  const extensao = path.extname(arquivo.name) || ".jpg";
  const nomeArquivo = `promocao-${tipo}-${Date.now()}${extensao}`;

  const pasta = caminhoUploads(sessao.imobiliariaId, "promocoes");
  await fs.mkdir(pasta, { recursive: true });

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(path.join(pasta, nomeArquivo), buffer);

  const urlPublica = `/uploads/${sessao.imobiliariaId}/promocoes/${nomeArquivo}`;
  return NextResponse.json({ url: urlPublica });
}
