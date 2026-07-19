import Jimp from "jimp";
import path from "path";
import fs from "fs/promises";

/**
 * Aplica marca d'água (logo da imobiliária ou texto) na foto enviada e
 * salva a versão final, mantendo o original intacto em outra pasta (caso
 * seja necessário reprocessar).
 *
 * Usa a biblioteca "jimp" (100% JavaScript, sem binários nativos) em vez
 * de "sharp", para evitar falhas de instalação em hospedagens compartilhadas
 * (cPanel) que bloqueiam o download do binário nativo do sharp durante o
 * "npm install".
 */
export type PosicaoMarcaDagua = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export async function aplicarMarcaDagua(params: {
  caminhoOriginal: string;
  caminhoSaida: string;
  logoPath?: string | null;
  textoFallback?: string;
  tamanhoPercent?: number; // % da largura da foto ocupado pela marca (logo ou texto)
  posicao?: PosicaoMarcaDagua;
}) {
  const {
    caminhoOriginal,
    caminhoSaida,
    logoPath,
    textoFallback,
    tamanhoPercent = 18,
    posicao = "bottom-right"
  } = params;

  // Lê a foto original primeiro: se isso falhar (arquivo corrompido/formato não
  // suportado pelo jimp), deixamos o erro subir para quem chamou decidir o que
  // fazer (ex.: salvar a foto sem marca d'água em vez de perder o upload).
  const imagem = await Jimp.read(caminhoOriginal);
  const largura = imagem.bitmap.width;
  const percent = Math.min(Math.max(tamanhoPercent, 5), 60) / 100;

  let marca: Jimp | null = null;

  if (logoPath) {
    try {
      if (await arquivoExiste(logoPath)) {
        const larguraLogo = Math.round(largura * percent);
        marca = await Jimp.read(logoPath);
        marca.resize(larguraLogo, Jimp.AUTO);
      }
    } catch {
      // Logo inválida/corrompida: cai para o texto de fallback abaixo em
      // vez de derrubar o upload inteiro.
      marca = null;
    }
  }

  if (!marca) {
    // Fallback: gera marca de texto sobre um retângulo semi-transparente
    const texto = textoFallback || "Imóveis";
    const largMarca = Math.round(largura * percent * 2.2);
    const altMarca = Math.round(largMarca / 6);
    // Preto com ~35% de opacidade (formato 0xRRGGBBAA)
    marca = new Jimp(largMarca, altMarca, 0x00000059);
    // Jimp.FONT_SANS_32_WHITE é um caminho relativo calculado dentro do
    // próprio pacote "jimp"; quando o código passa pelo empacotamento do
    // Next.js, esse caminho deixa de existir no servidor (vira algo como
    // ".next/server/fonts/..."). Usamos o caminho absoluto real, resolvido
    // pelo server.js a partir de __dirname (ver UPLOADS_DIR/JIMP_FONTS_DIR),
    // como alternativa confiável.
    const caminhoFonte = process.env.JIMP_FONTS_DIR
      ? path.join(process.env.JIMP_FONTS_DIR, "open-sans", "open-sans-32-white", "open-sans-32-white.fnt")
      : Jimp.FONT_SANS_32_WHITE;
    const fonte = await Jimp.loadFont(caminhoFonte);
    marca.print(
      fonte,
      0,
      0,
      {
        text: texto,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      largMarca,
      altMarca
    );
  }

  const margem = 24;
  const { x, y } = calcularPosicao(
    posicao,
    largura,
    imagem.bitmap.height,
    marca.bitmap.width,
    marca.bitmap.height,
    margem
  );

  imagem.composite(marca, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 1,
    opacityDest: 1
  });

  await imagem.writeAsync(caminhoSaida);

  return caminhoSaida;
}

function calcularPosicao(
  posicao: PosicaoMarcaDagua,
  larguraFoto: number,
  alturaFoto: number,
  larguraMarca: number,
  alturaMarca: number,
  margem: number
) {
  switch (posicao) {
    case "top-left":
      return { x: margem, y: margem };
    case "top-right":
      return { x: Math.max(0, larguraFoto - larguraMarca - margem), y: margem };
    case "bottom-left":
      return { x: margem, y: Math.max(0, alturaFoto - alturaMarca - margem) };
    case "center":
      return {
        x: Math.max(0, Math.round((larguraFoto - larguraMarca) / 2)),
        y: Math.max(0, Math.round((alturaFoto - alturaMarca) / 2))
      };
    case "bottom-right":
    default:
      return {
        x: Math.max(0, larguraFoto - larguraMarca - margem),
        y: Math.max(0, alturaFoto - alturaMarca - margem)
      };
  }
}

async function arquivoExiste(caminho: string) {
  try {
    await fs.access(caminho);
    return true;
  } catch {
    return false;
  }
}

export function caminhoUploads(...partes: string[]) {
  const base = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
  return path.join(base, ...partes);
}
