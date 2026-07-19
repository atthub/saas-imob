import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterSessaoAtual } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { caminhoUploads } from "@/lib/watermark";

// POST /api/upload/favicon -> envia o ícone exibido na aba do navegador
// (favicon) do site público da imobiliária.
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
  const tiposAceitos = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];
  if (!tiposAceitos.includes(arquivo.type)) {
    return NextResponse.json({ erro: "Envie um arquivo PNG, ICO ou SVG." }, { status: 400 });
  }

  const extensao = path.extname(arquivo.name) || ".png";
  const nomeArquivo = `favicon-${Date.now()}${extensao}`;

  const pastaTenant = caminhoUploads(sessao.imobiliariaId, "config");
  await fs.mkdir(pastaTenant, { recursive: true });

  const caminhoDestino = path.join(pastaTenant, nomeArquivo);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(caminhoDestino, buffer);

  const urlPublica = `/uploads/${sessao.imobiliariaId}/config/${nomeArquivo}`;

  await prisma.imobiliaria.update({
    where: { id: sessao.imobiliariaId },
    data: { faviconUrl: urlPublica }
  });

  return NextResponse.json({ faviconUrl: urlPublica });
}
