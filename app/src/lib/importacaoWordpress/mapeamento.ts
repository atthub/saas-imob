// Conversão dos dados "soltos" do WordPress (textos de categoria, nomes de
// campo customizado) para os enums/estrutura do nosso modelo `Imovel`.

import type { TipoImovel, FinalidadeImovel } from "@prisma/client";

// IDs dos campos customizados do plugin Classified Listing (post_type = 'rtcl_cf').
// Cada instalação WordPress tem IDs diferentes — configuráveis via env vars.
// Os valores abaixo são os defaults da instalação Delta Imóveis Pinda (IDs 15291–15300).
// Para outros clientes, defina as env vars WP_CAMPO_* no .env do servidor.
export const CAMPOS_WP = {
  CODIGO: 15291,
  TIPO_DE_OPERACAO: 15292,
  EMPREENDIMENTO: 15293,
  TIPO_DE_IMOVEL: 15294,
  BANHEIRO: 15295,
  QUARTOS: 15296,
  SUITES: 15297,
  GARAGEM: 15298,
  AREA_UTIL: 15299,
  AREA_TOTAL: 15300
} as const;

// Meta keys usadas nos listings variam entre versões do plugin.
// Versão antiga (Delta): _field_<ID>   Versão nova (RTCL Pro): select_xxx, number_xxx, etc.
// Configurar no .env do servidor para cada cliente.
export function getMetaKeys() {
  return {
    TIPO_IMOVEL:   process.env.WP_META_TIPO_IMOVEL   || null,
    TIPO_OPERACAO: process.env.WP_META_TIPO_OPERACAO  || null,
    QUARTOS:       process.env.WP_META_QUARTOS        || null,
    BANHEIROS:     process.env.WP_META_BANHEIROS      || null,
    SUITES:        process.env.WP_META_SUITES         || null,
    GARAGEM:       process.env.WP_META_GARAGEM        || null,
    AREA_UTIL:     process.env.WP_META_AREA_UTIL      || null,
    AREA_TOTAL:    process.env.WP_META_AREA_TOTAL     || null,
    CODIGO:        process.env.WP_META_CODIGO         || null,
    // null = usar _rtcl_attachments_order (Delta); "images" = formato novo (RTCL Pro)
    IMAGENS:       process.env.WP_META_IMAGENS        || null,
  };
}

// Retorna os IDs corretos para a instalação atual, lendo do .env em runtime.
// Se as env vars não estiverem definidas, usa os defaults da Delta acima.
export function getCamposWp() {
  return {
    CODIGO:           Number(process.env.WP_CAMPO_CODIGO)          || CAMPOS_WP.CODIGO,
    TIPO_DE_OPERACAO: Number(process.env.WP_CAMPO_TIPO_OPERACAO)   || CAMPOS_WP.TIPO_DE_OPERACAO,
    EMPREENDIMENTO:   Number(process.env.WP_CAMPO_EMPREENDIMENTO)  || CAMPOS_WP.EMPREENDIMENTO,
    TIPO_DE_IMOVEL:   Number(process.env.WP_CAMPO_TIPO_IMOVEL)     || CAMPOS_WP.TIPO_DE_IMOVEL,
    BANHEIRO:         Number(process.env.WP_CAMPO_BANHEIRO)        || CAMPOS_WP.BANHEIRO,
    QUARTOS:          Number(process.env.WP_CAMPO_QUARTOS)         || CAMPOS_WP.QUARTOS,
    SUITES:           Number(process.env.WP_CAMPO_SUITES)          || CAMPOS_WP.SUITES,
    GARAGEM:          Number(process.env.WP_CAMPO_GARAGEM)         || CAMPOS_WP.GARAGEM,
    AREA_UTIL:        Number(process.env.WP_CAMPO_AREA_UTIL)       || CAMPOS_WP.AREA_UTIL,
    AREA_TOTAL:       Number(process.env.WP_CAMPO_AREA_TOTAL)      || CAMPOS_WP.AREA_TOTAL
  };
}

export function metaKeyCampo(id: number) {
  return `_field_${id}`;
}

// Resultado da conversão de uma categoria/termo do WordPress: o termo combina
// tipo + finalidade + condição em um texto só (ex: "Casa para venda (USADO)"),
// então devolvemos os três (condição é só informativa por enquanto — não
// existe esse campo no nosso schema, fica registrada na descrição/obs).
export type ResultadoCategoria = {
  tipo: TipoImovel;
  finalidade: FinalidadeImovel;
  condicao: "USADO" | "NOVO" | null;
  confiavel: boolean; // false quando tivemos que "advinhar" (categoria fora do padrão)
};

const MAPA_TIPO: { regex: RegExp; tipo: TipoImovel }[] = [
  { regex: /sobrado|casa/i, tipo: "CASA" },
  { regex: /apartamento/i, tipo: "APARTAMENTO" },
  { regex: /terrenos?|lote/i, tipo: "TERRENO" },
  { regex: /sala comercial|ponto comercial/i, tipo: "SALA_COMERCIAL" },
  { regex: /galp[aã]o/i, tipo: "GALPAO" },
  { regex: /ch[aá]cara/i, tipo: "CHACARA" },
  { regex: /kitnet/i, tipo: "KITNET" },
  { regex: /espa[cç]o (de|para) festas?/i, tipo: "ESPACO_FESTAS" }
];

export function categoriaParaImovel(nomeCategoria: string): ResultadoCategoria {
  const texto = nomeCategoria.trim();
  const tipoEncontrado = MAPA_TIPO.find((m) => m.regex.test(texto));
  const tipo = tipoEncontrado?.tipo ?? "OUTRO";

  let finalidade: FinalidadeImovel;
  if (/loca[cç][aã]o/i.test(texto) && /venda/i.test(texto)) {
    finalidade = "VENDA_E_LOCACAO";
  } else if (/loca[cç][aã]o/i.test(texto)) {
    finalidade = "LOCACAO";
  } else if (/venda/i.test(texto)) {
    finalidade = "VENDA";
  } else {
    // Categorias fora do padrão ("Imóvel Alto Padrão", "Ponto Comercial",
    // "Alto padrão"...) não dizem a finalidade — assumimos VENDA como
    // padrão mais comum e marcamos confiavel=false para revisão manual.
    finalidade = "VENDA";
  }

  const condicaoMatch = texto.match(/\((USADO|NOVO)\)/i);
  const condicao = condicaoMatch ? (condicaoMatch[1].toUpperCase() as "USADO" | "NOVO") : null;

  const confiavel = !!tipoEncontrado && /venda|loca[cç][aã]o/i.test(texto);

  return { tipo, finalidade, condicao, confiavel };
}

// Localização do WordPress (taxonomia "rtcl_location") é hierárquica: o
// termo-filho é o bairro (ex: "Pasin") e o termo-pai é a cidade, no formato
// "Cidade - UF" (ex: "Moreira César - SP"). Aqui só separamos o texto da
// cidade; achar/criar o registro de Cidade/Bairro fica na rotina principal.
export function separarCidadeUf(textoCidade: string): { nome: string; uf: string | null } {
  const partes = textoCidade.split(" - ").map((p) => p.trim());
  if (partes.length === 2 && partes[1].length === 2) {
    return { nome: partes[0], uf: partes[1].toUpperCase() };
  }
  return { nome: textoCidade.trim(), uf: null };
}

// Descrição do anúncio (post_content) vem com HTML do editor clássico do
// WordPress e, em vários casos, com os shortcodes do Shortcoder
// (ex.: [sc name="quartos"][/sc] Quartos) usados só para exibir os mesmos
// dados que já importamos via _field_*. Removemos shortcodes e tags HTML
// para sobrar só o texto corrido da descrição.
export function limparDescricaoWp(html: string | null | undefined): string | null {
  if (!html) return null;
  const semShortcode = html.replace(/\[sc[^\]]*\]/gi, "").replace(/\[\/sc\]/gi, "");
  const semTags = semShortcode
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return semTags.length > 0 ? semTags : null;
}

// Os campos customizados "Tipo de Imóvel" e "Tipo de Operação" guardam texto
// livre digitado/selecionado no admin do WordPress (ex.: "Casa", "Venda").
// Quando presentes, são mais confiáveis que advinhar pela categoria — então a
// rotina de importação tenta estes primeiro e só cai para a categoria como
// reserva.
export function textoTipoParaEnum(texto: string | null | undefined): TipoImovel | null {
  if (!texto) return null;
  const encontrado = MAPA_TIPO.find((m) => m.regex.test(texto));
  return encontrado?.tipo ?? null;
}

export function textoOperacaoParaEnum(texto: string | null | undefined): FinalidadeImovel | null {
  if (!texto) return null;
  const temVenda = /venda/i.test(texto);
  const temLocacao = /loca[cç][aã]o|aluguel/i.test(texto);
  if (temVenda && temLocacao) return "VENDA_E_LOCACAO";
  if (temLocacao) return "LOCACAO";
  if (temVenda) return "VENDA";
  return null;
}

// Converte número no formato brasileiro ("142,20") ou já no formato com ponto
// para um número JS. Strings vazias/inválidas retornam null em vez de NaN,
// para podermos salvar o campo como vazio em vez de 0.
export function numeroBr(texto: string | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  const limpo = String(texto).trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function inteiro(texto: string | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  const limpo = String(texto).trim();
  if (limpo === "") return null;
  const n = parseInt(limpo, 10);
  return Number.isFinite(n) ? n : null;
}
