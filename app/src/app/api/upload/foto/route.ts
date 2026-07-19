import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { obterSessaoAtual } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { aplicarMarcaDagua, caminhoUploads } from "@/lib/watermark";

// Recebe um upload (multipart/form-data) de foto de imóvel, salva o
// arquivo original, gera a versão com marca d'água e devolve as URLs.
//
// Importante: se a marca d'água falhar por qualquer motivo (ex.: foto em
// formato que a biblioteca de imagem não consegue processar), NÃO perdemos
// o upload — caímos para salvar a foto original sem marca d'água e avisamos
// o motivo na resposta, em vez de devolver um erro genérico/silencioso.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const imovelId = formData.get("imovelId") as string | null;
    const aplicarMarca = formData.get("marcaDagua") !== "false";

    if (!arquivo || !imovelId) {
      return NextResponse.json({ erro: "Envie o arquivo e o id do imóvel." }, { status: 400 });
    }

    if (!arquivo.type?.startsWith("image/")) {
      return NextResponse.json({ erro: "Envie apenas arquivos de imagem." }, { status: 400 });
    }

    const imobiliaria = await prisma.imobiliaria.findUnique({ where: { id: sessao.imobiliariaId } });

    const extensao = path.extname(arquivo.name) || ".jpg";
    const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensao}`;

    const pastaTenant = caminhoUploads(sessao.imobiliariaId, "imoveis", imovelId);
    await fs.mkdir(pastaTenant, { recursive: true });

    const caminhoOriginal = path.join(pastaTenant, `original-${nomeArquivo}`);
    const caminhoFinal = path.join(pastaTenant, nomeArquivo);

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await fs.writeFile(caminhoOriginal, buffer);

    let avisoMarcaDagua: string | null = null;

    if (aplicarMarca) {
      try {
        const logoRelativo = imobiliaria?.marcaDaguaUrl || imobiliaria?.logoUrl || null;
        await aplicarMarcaDagua({
          caminhoOriginal,
          caminhoSaida: caminhoFinal,
          logoPath: logoRelativo ? caminhoUploads(...caminhoRelativoParaPartes(logoRelativo)) : null,
          textoFallback: imobiliaria?.nome,
          tamanhoPercent: imobiliaria?.marcaDaguaTamanho ?? 18,
          posicao: (imobiliaria?.marcaDaguaPosicao as any) ?? "bottom-right"
        });
      } catch (erroMarca) {
        console.error("Falha ao aplicar marca d'água, salvando foto original sem marca:", erroMarca);
        await fs.copyFile(caminhoOriginal, caminhoFinal);
        // Inclui a mensagem técnica do erro no aviso (visível só para o admin
        // no painel) para conseguirmos diagnosticar sem precisar de acesso a
        // logs do servidor, já que nem todo plano de hospedagem expõe isso.
        const detalheErro = erroMarca instanceof Error ? erroMarca.message : String(erroMarca);
        avisoMarcaDagua = `Não foi possível aplicar a marca d'água nesta foto; ela foi salva sem marca. (Detalhe técnico: ${detalheErro})`;
      }
    } else {
      await fs.copyFile(caminhoOriginal, caminhoFinal);
    }

    const urlPublica = `/uploads/${sessao.imobiliariaId}/imoveis/${imovelId}/${nomeArquivo}`;
    const urlOriginal = `/uploads/${sessao.imobiliariaId}/imoveis/${imovelId}/original-${nomeArquivo}`;

    const totalFotos = await prisma.foto.count({ where: { imovelId } });

    const foto = await prisma.foto.create({
      data: {
        imovelId,
        url: urlPublica,
        urlOriginal,
        ordem: totalFotos,
        capa: totalFotos === 0
      }
    });

    return NextResponse.json({ foto, avisoMarcaDagua });
  } catch (erro) {
    console.error("Erro inesperado no upload de foto:", erro);
    return NextResponse.json(
      { erro: "Não foi possível enviar esta foto. Tente novamente." },
      { status: 500 }
    );
  }
}

// "logoUrl"/"marcaDaguaUrl" são salvos como caminho público (ex.:
// "/uploads/<imobiliariaId>/logo.png"); caminhoUploads() espera as partes
// já sem o prefixo "/uploads/", então removemos esse prefixo aqui.
function caminhoRelativoParaPartes(urlPublica: string): string[] {
  const semBarraInicial = urlPublica.replace(/^\/?uploads\//, "");
  return semBarraInicial.split("/");
}
