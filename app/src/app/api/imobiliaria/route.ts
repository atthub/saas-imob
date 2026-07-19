import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// MySQL via $queryRaw pode retornar TINYINT(1) como boolean (campo Prisma) ou number (ALTER TABLE).
// Esta função normaliza os dois casos.
function toBool(val: unknown, fallback: boolean): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "bigint") return val !== BigInt(0);
  return fallback;
}

const SELECAO_PADRAO = {
  id: true,
  nome: true,
  creci: true,
  descricao: true,
  logoUrl: true,
  logoAltura: true,
  faviconUrl: true,
  heroTitulo: true,
  heroSubtitulo: true,
  telefone: true,
  whatsapp: true,
  email: true,
  endereco: true,
  cidadePrincipal: true,
  estadoPrincipal: true,
  templateId: true,
  corPrimaria: true,
  corSecundaria: true,
  corDestaque: true,
  corFundo: true,
  fontHeading: true,
  fontBody: true,
  marcaDaguaUrl: true,
  marcaDaguaTamanho: true,
  marcaDaguaPosicao: true,
  whatsappBotaoAtivo: true,
  whatsappBotaoNumero: true,
  whatsappBotaoMensagem: true,
  whatsappBotaoPosicao: true,
  whatsappBotaoIcone: true,
  itensPorPagina: true,
  tipoPaginacao: true,
  modoDestaque: true,
  xmlHabilitado: true,
  xmlToken: true
} as const;
// Nota: mcmvHabilitado, blogMenuHabilitado, blogHomepageHabilitado são lidos via
// $queryRaw (bypassa DMMF) pois o Prisma Client do servidor pode ter sido gerado
// antes desses campos existirem no schema local.

// GET /api/imobiliaria -> dados completos da imobiliária da sessão atual,
// usados na tela de Configurações (identidade visual, contato, marca d'água).
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const imobiliaria = await prisma.imobiliaria.findUnique({
    where: { id: sessao.imobiliariaId },
    select: SELECAO_PADRAO
  });

  if (!imobiliaria) {
    return NextResponse.json({ erro: "Imobiliária não encontrada." }, { status: 404 });
  }

  // Todos os toggles lidos via $queryRawUnsafe (parâmetros explícitos).
  // IMPORTANTE: $queryRaw tagged template falha silenciosamente neste servidor
  // (Phusion Passenger/CloudLinux) — usar sempre $queryRawUnsafe("SQL", param).
  let mcmvHabilitado = false;
  let blogMenuHabilitado = true;
  let blogHomepageHabilitado = false;
  try {
    const rows = await prisma.$queryRawUnsafe<[{ mcmvHabilitado: unknown }]>(
      "SELECT mcmvHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    mcmvHabilitado = toBool(rows[0]?.mcmvHabilitado, false);
  } catch { /* coluna não existe */ }
  try {
    const rows = await prisma.$queryRawUnsafe<[{ blogMenuHabilitado: unknown }]>(
      "SELECT blogMenuHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    blogMenuHabilitado = toBool(rows[0]?.blogMenuHabilitado, true);
  } catch { /* coluna não existe, default = true */ }
  try {
    const rows = await prisma.$queryRawUnsafe<[{ blogHomepageHabilitado: unknown }]>(
      "SELECT blogHomepageHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    blogHomepageHabilitado = toBool(rows[0]?.blogHomepageHabilitado, false);
  } catch { /* coluna não existe */ }

  return NextResponse.json({ imobiliaria: { ...imobiliaria, mcmvHabilitado, blogMenuHabilitado, blogHomepageHabilitado } });
}

// PUT /api/imobiliaria -> atualiza as configurações gerais (identidade
// visual, contato/localização, marca d'água). Uploads de imagem (logo,
// favicon, marca d'água) têm rotas próprias por serem multipart/form-data.
export async function PUT(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar configurações." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const posicoesValidas = ["top-left", "top-right", "bottom-left", "bottom-right", "center"];
  const corHexValida = /^#[0-9A-Fa-f]{6}$/;

  function textoOpcional(valor: unknown, limite = 255) {
    if (typeof valor !== "string") return undefined;
    const texto = valor.trim();
    return texto.slice(0, limite);
  }

  function corOpcional(valor: unknown) {
    if (typeof valor !== "string") return undefined;
    return corHexValida.test(valor) ? valor : undefined;
  }

  const marcaDaguaTamanho =
    typeof body.marcaDaguaTamanho === "number"
      ? Math.min(Math.max(Math.round(body.marcaDaguaTamanho), 5), 60)
      : undefined;

  const logoAltura =
    typeof body.logoAltura === "number"
      ? Math.min(Math.max(Math.round(body.logoAltura), 20), 160)
      : undefined;

  // Hero (banner principal do site): título/subtítulo editáveis pelo
  // white label, com limite de caracteres para não estourar o layout no
  // desktop ou no mobile (ver tamanhos máximos também no schema.prisma e
  // no formulário de Configurações).
  function heroTextoOpcional(valor: unknown, limite: number) {
    if (typeof valor !== "string") return undefined;
    const texto = valor.trim().slice(0, limite);
    return texto.length > 0 ? texto : undefined;
  }

  const heroTitulo = heroTextoOpcional(body.heroTitulo, 70);
  const heroSubtitulo = heroTextoOpcional(body.heroSubtitulo, 160);

  const marcaDaguaPosicao =
    typeof body.marcaDaguaPosicao === "string" && posicoesValidas.includes(body.marcaDaguaPosicao)
      ? body.marcaDaguaPosicao
      : undefined;

  // Balão flutuante de WhatsApp na vitrine pública.
  const posicoesWhatsappValidas = ["bottom-right", "bottom-left"];
  const iconesWhatsappValidos = ["whatsapp", "message-circle", "message-square", "phone"];

  const whatsappBotaoAtivo = typeof body.whatsappBotaoAtivo === "boolean" ? body.whatsappBotaoAtivo : undefined;

  const whatsappBotaoNumero =
    typeof body.whatsappBotaoNumero === "string"
      ? body.whatsappBotaoNumero.trim().slice(0, 30)
      : body.whatsappBotaoNumero === null
      ? null
      : undefined;

  const whatsappBotaoMensagem = heroTextoOpcional(body.whatsappBotaoMensagem, 160);

  const whatsappBotaoPosicao =
    typeof body.whatsappBotaoPosicao === "string" && posicoesWhatsappValidas.includes(body.whatsappBotaoPosicao)
      ? body.whatsappBotaoPosicao
      : undefined;

  const whatsappBotaoIcone =
    typeof body.whatsappBotaoIcone === "string" && iconesWhatsappValidos.includes(body.whatsappBotaoIcone)
      ? body.whatsappBotaoIcone
      : undefined;

  // templateId: aceita string (id de um Template existente) ou null
  // explícito (volta para o template/layout padrão do código).
  let templateId: string | null | undefined;
  if (body.templateId === null) {
    templateId = null;
  } else if (typeof body.templateId === "string" && body.templateId.length > 0) {
    templateId = body.templateId;
  }

  const dados = {
    nome: textoOpcional(body.nome),
    creci: textoOpcional(body.creci, 50),
    descricao: textoOpcional(body.descricao, 2000),
    telefone: textoOpcional(body.telefone, 30),
    whatsapp: textoOpcional(body.whatsapp, 30),
    email: textoOpcional(body.email, 150),
    endereco: textoOpcional(body.endereco, 255),
    cidadePrincipal: textoOpcional(body.cidadePrincipal, 100),
    estadoPrincipal: textoOpcional(body.estadoPrincipal, 2),
    fontHeading: textoOpcional(body.fontHeading, 60),
    fontBody: textoOpcional(body.fontBody, 60),
    corPrimaria: corOpcional(body.corPrimaria),
    corSecundaria: corOpcional(body.corSecundaria),
    corDestaque: corOpcional(body.corDestaque),
    corFundo: corOpcional(body.corFundo),
    ...(templateId !== undefined ? { templateId } : {}),
    ...(logoAltura !== undefined ? { logoAltura } : {}),
    ...(heroTitulo !== undefined ? { heroTitulo } : {}),
    ...(heroSubtitulo !== undefined ? { heroSubtitulo } : {}),
    ...(marcaDaguaTamanho !== undefined ? { marcaDaguaTamanho } : {}),
    ...(marcaDaguaPosicao !== undefined ? { marcaDaguaPosicao } : {}),
    ...(whatsappBotaoAtivo !== undefined ? { whatsappBotaoAtivo } : {}),
    ...(whatsappBotaoNumero !== undefined ? { whatsappBotaoNumero } : {}),
    ...(whatsappBotaoMensagem !== undefined ? { whatsappBotaoMensagem } : {}),
    ...(whatsappBotaoPosicao !== undefined ? { whatsappBotaoPosicao } : {}),
    ...(whatsappBotaoIcone !== undefined ? { whatsappBotaoIcone } : {}),
    ...(typeof body.itensPorPagina === "number" && body.itensPorPagina > 0
      ? { itensPorPagina: Math.min(Math.max(Math.round(body.itensPorPagina), 1), 100) }
      : {}),
    ...(typeof body.tipoPaginacao === "string" && ["paginada", "scroll-infinito"].includes(body.tipoPaginacao)
      ? { tipoPaginacao: body.tipoPaginacao }
      : {}),
    ...(typeof body.modoDestaque === "string" && ["grade", "especial"].includes(body.modoDestaque)
      ? { modoDestaque: body.modoDestaque }
      : {}),
    ...(typeof body.xmlHabilitado === "boolean" ? { xmlHabilitado: body.xmlHabilitado } : {}),
    ...(body.xmlToken === null
      ? { xmlToken: null }
      : typeof body.xmlToken === "string" && body.xmlToken.length > 0
      ? { xmlToken: body.xmlToken.slice(0, 100) }
      : {})
  };

  // Remove chaves cujo valor ficou undefined (campo não enviado/invalido),
  // para não sobrescrever com undefined no Prisma.
  const dadosFiltrados = Object.fromEntries(
    Object.entries(dados).filter(([, valor]) => valor !== undefined)
  );

  const imobiliaria = await prisma.imobiliaria.update({
    where: { id: sessao.imobiliariaId },
    data: dadosFiltrados,
    select: SELECAO_PADRAO
  });

  // Toggles salvos via $executeRawUnsafe individual (bypassa DMMF, mais confiável
  // que tagged template $executeRaw em produção com Phusion Passenger).
  let mcmvHabilitado = false;
  let blogMenuHabilitado = true;
  let blogHomepageHabilitado = false;

  if (typeof body.mcmvHabilitado === "boolean") {
    const v = body.mcmvHabilitado ? 1 : 0;
    try {
      await prisma.$executeRawUnsafe(
        "UPDATE imobiliarias SET mcmvHabilitado = ? WHERE id = ?",
        v, sessao.imobiliariaId
      );
    } catch { /* coluna não existe */ }
  }
  if (typeof body.blogMenuHabilitado === "boolean") {
    const v = body.blogMenuHabilitado ? 1 : 0;
    try {
      await prisma.$executeRawUnsafe(
        "UPDATE imobiliarias SET blogMenuHabilitado = ? WHERE id = ?",
        v, sessao.imobiliariaId
      );
    } catch { /* coluna não existe */ }
  }
  if (typeof body.blogHomepageHabilitado === "boolean") {
    const v = body.blogHomepageHabilitado ? 1 : 0;
    try {
      await prisma.$executeRawUnsafe(
        "UPDATE imobiliarias SET blogHomepageHabilitado = ? WHERE id = ?",
        v, sessao.imobiliariaId
      );
    } catch { /* coluna não existe */ }
  }

  // Lê estado real do banco via $queryRawUnsafe (parâmetros explícitos — forma confiável neste servidor)
  try {
    const rows = await prisma.$queryRawUnsafe<[{ mcmvHabilitado: unknown }]>(
      "SELECT mcmvHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    mcmvHabilitado = toBool(rows[0]?.mcmvHabilitado, false);
  } catch { /* coluna não existe */ }
  try {
    const rows = await prisma.$queryRawUnsafe<[{ blogMenuHabilitado: unknown }]>(
      "SELECT blogMenuHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    blogMenuHabilitado = toBool(rows[0]?.blogMenuHabilitado, true);
  } catch { /* coluna não existe, default = true */ }
  try {
    const rows = await prisma.$queryRawUnsafe<[{ blogHomepageHabilitado: unknown }]>(
      "SELECT blogHomepageHabilitado FROM imobiliarias WHERE id = ?",
      sessao.imobiliariaId
    );
    blogHomepageHabilitado = toBool(rows[0]?.blogHomepageHabilitado, false);
  } catch { /* coluna não existe */ }

  return NextResponse.json({ imobiliaria: { ...imobiliaria, mcmvHabilitado, blogMenuHabilitado, blogHomepageHabilitado } });
}
