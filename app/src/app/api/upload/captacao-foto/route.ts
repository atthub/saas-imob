import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { caminhoUploads } from "@/lib/watermark";

// POST /api/upload/captacao-foto -> upload público (sem login) de fotos do
// imóvel anunciadas no formulário de captação. Cada chamada salva 1 arquivo
// e devolve a URL pública; o formulário chama esta rota uma vez por foto
// selecionada (mesmo padrão usado nos outros uploads do projeto).
//
// Limites de segurança: só imagem, até 8MB por arquivo — evita abuso do
// armazenamento por um formulário público sem autenticação.
const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) {
    return NextResponse.json({ erro: "Site em configuração." }, { status: 503 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (!arquivo.type?.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem (PNG ou JPG)." }, { status: 400 });
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json({ erro: "Cada foto deve ter no máximo 8MB." }, { status: 400 });
  }

  const extensao = path.extname(arquivo.name) || ".jpg";
  const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensao}`;

  const pastaTenant = caminhoUploads(imobiliaria.id, "captacoes", "temp");
  await fs.mkdir(pastaTenant, { recursive: true });

  const caminhoDestino = path.join(pastaTenant, nomeArquivo);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(caminhoDestino, buffer);

  const urlPublica = `/uploads/${imobiliaria.id}/captacoes/temp/${nomeArquivo}`;

  return NextResponse.json({ url: urlPublica });
}
