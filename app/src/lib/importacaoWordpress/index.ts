import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { caminhoUploads } from "@/lib/watermark";
import { poolWp, prefixoWp } from "./wpDb";
import {
  getCamposWp,
  getMetaKeys,
  metaKeyCampo,
  categoriaParaImovel,
  separarCidadeUf,
  limparDescricaoWp,
  textoTipoParaEnum,
  textoOperacaoParaEnum,
  numeroBr,
  inteiro
} from "./mapeamento";
import { extrairIdsDeArrayPhpSerializado, extrairUidsDeImagesWp } from "./phpSerialize";

export type ResultadoLote = {
  totalWp: number;
  jaImportadosAntes: number;
  processadosNesteLote: number;
  importadosComSucesso: number;
  erros: { wpId: number; titulo?: string; erro: string }[];
  restantes: number;
};

// Busca, na ordem, os IDs de TODOS os anúncios do WordPress (qualquer status —
// publish, private, draft, rtcl-expired, trash) e os IDs já trazidos para este
// tenant — a diferença é o que ainda falta importar. Nada é descartado aqui;
// quem decide o que aparece na vitrine pública é o campo status do Imovel.
async function listarPendentes(imobiliariaId: string) {
  const prefixo = prefixoWp();
  const [linhas] = await poolWp().query<any[]>(
    `SELECT ID FROM ${prefixo}posts WHERE post_type = 'rtcl_listing' ORDER BY ID ASC`
  );
  const todosIds: number[] = linhas.map((l: any) => l.ID);

  const importados = await prisma.imovel.findMany({
    where: { imobiliariaId, origemWpId: { not: null } },
    select: { origemWpId: true }
  });
  const importadosSet = new Set(importados.map((i) => i.origemWpId as number));

  const pendentes = todosIds.filter((id) => !importadosSet.has(id));
  return { todosIds, importadosSet, pendentes };
}

export async function consultarProgresso(imobiliariaId: string) {
  const { todosIds, importadosSet } = await listarPendentes(imobiliariaId);
  return {
    totalWp: todosIds.length,
    jaImportados: importadosSet.size,
    restantes: todosIds.length - importadosSet.size
  };
}

export async function importarLote(imobiliariaId: string, quantidade: number): Promise<ResultadoLote> {
  const { todosIds, importadosSet, pendentes } = await listarPendentes(imobiliariaId);
  const loteAtual = pendentes.slice(0, Math.max(1, quantidade));

  const erros: ResultadoLote["erros"] = [];
  let sucesso = 0;

  for (const wpId of loteAtual) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await importarUmAnuncio(imobiliariaId, wpId);
      sucesso += 1;
    } catch (erro: any) {
      erros.push({ wpId, erro: erro?.message || String(erro) });
    }
  }

  return {
    totalWp: todosIds.length,
    jaImportadosAntes: importadosSet.size,
    processadosNesteLote: loteAtual.length,
    importadosComSucesso: sucesso,
    erros,
    restantes: todosIds.length - importadosSet.size - sucesso
  };
}

async function importarUmAnuncio(imobiliariaId: string, wpId: number) {
  const CAMPOS_WP = getCamposWp();
  const MK = getMetaKeys();
  const prefixo = prefixoWp();
  const pool = poolWp();

  const [postRows] = await pool.query<any[]>(
    `SELECT ID, post_title, post_content, post_status FROM ${prefixo}posts WHERE ID = ?`,
    [wpId]
  );
  const post = postRows[0];
  if (!post) throw new Error("Post não encontrado no WordPress (pode ter sido apagado).");

  const [metaRows] = await pool.query<any[]>(
    `SELECT meta_key, meta_value FROM ${prefixo}postmeta WHERE post_id = ?`,
    [wpId]
  );
  const meta = new Map<string, string>();
  for (const linha of metaRows) {
    // Quando a mesma chave aparece mais de uma vez, mantém a primeira não-vazia.
    if (!meta.has(linha.meta_key) || !meta.get(linha.meta_key)) {
      meta.set(linha.meta_key, linha.meta_value);
    }
  }

  const [taxRows] = await pool.query<any[]>(
    `SELECT tt.taxonomy, t.name
     FROM ${prefixo}term_relationships tr
     JOIN ${prefixo}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
     JOIN ${prefixo}terms t ON t.term_id = tt.term_id
     WHERE tr.object_id = ?`,
    [wpId]
  );
  const categorias: string[] = taxRows.filter((t: any) => t.taxonomy === "rtcl_category").map((t: any) => t.name);
  const locais: string[] = taxRows.filter((t: any) => t.taxonomy === "rtcl_location").map((t: any) => t.name);

  // Helper: lê pelo meta key configurado no .env ou cai para _field_<ID> (formato Delta)
  const mk = (envKey: string | null, fallbackId: number) =>
    meta.get(envKey ?? metaKeyCampo(fallbackId));

  // --- tipo / finalidade -----------------------------------------------
  const categoriaInfo = categorias[0] ? categoriaParaImovel(categorias[0]) : null;
  const tipoPorCampo = textoTipoParaEnum(mk(MK.TIPO_IMOVEL, CAMPOS_WP.TIPO_DE_IMOVEL));
  const finalidadePorCampo = textoOperacaoParaEnum(mk(MK.TIPO_OPERACAO, CAMPOS_WP.TIPO_DE_OPERACAO));

  const tipo = tipoPorCampo ?? categoriaInfo?.tipo ?? "OUTRO";
  const finalidade = finalidadePorCampo ?? categoriaInfo?.finalidade ?? "VENDA";
  const precisaRevisao = !tipoPorCampo && !categoriaInfo?.confiavel;

  // --- localização --------------------------------------------------------
  let cidadeId: string | undefined;
  let bairroId: string | undefined;
  const termoCidade = locais.find((nome) => separarCidadeUf(nome).uf !== null);
  const termoBairro = locais.find((nome) => nome !== termoCidade);

  if (termoCidade) {
    const { nome, uf } = separarCidadeUf(termoCidade);
    const cidade = await prisma.cidade.upsert({
      where: { nome_uf: { nome, uf: uf || "" } },
      update: {},
      create: { nome, uf: uf || "" }
    });
    cidadeId = cidade.id;

    if (termoBairro) {
      const bairro = await prisma.bairro.upsert({
        where: { nome_cidadeId: { nome: termoBairro, cidadeId: cidade.id } },
        update: {},
        create: { nome: termoBairro, cidadeId: cidade.id }
      });
      bairroId = bairro.id;
    }
  }

  // --- valores / características ------------------------------------------
  const preco = numeroBr(meta.get("price"));
  const valorVenda = finalidade !== "LOCACAO" ? preco ?? undefined : undefined;
  const valorLocacao = finalidade === "LOCACAO" || finalidade === "VENDA_E_LOCACAO" ? preco ?? undefined : undefined;

  const codigoWp = mk(MK.CODIGO, CAMPOS_WP.CODIGO);
  const codigoBase = codigoWp && codigoWp.trim() !== "" ? codigoWp.trim() : `WP-${wpId}`;

  const descricao = limparDescricaoWp(post.post_content);

  const observacao = precisaRevisao
    ? `Importado do WordPress (anúncio #${wpId}). Confira o tipo/finalidade — a categoria original não seguia o padrão usual e foi convertida automaticamente.`
    : `Importado do WordPress (anúncio #${wpId}).`;

  const dadosBase = {
    titulo: post.post_title || `Imóvel importado #${wpId}`,
    descricao,
    tipo,
    finalidade,
    // Só fica visível na vitrine pública quando o post original estava "publish".
    // private/draft/rtcl-expired/trash entram como INATIVO: continuam no
    // cadastro (não excluídos), mas não aparecem para o público.
    status: (post.post_status === "publish" ? "DISPONIVEL" : "INATIVO") as "DISPONIVEL" | "INATIVO",
    valorVenda,
    valorLocacao,
    areaTotal: numeroBr(mk(MK.AREA_TOTAL, CAMPOS_WP.AREA_TOTAL)) ?? undefined,
    areaConstruida: numeroBr(mk(MK.AREA_UTIL, CAMPOS_WP.AREA_UTIL)) ?? undefined,
    quartos: inteiro(mk(MK.QUARTOS, CAMPOS_WP.QUARTOS)) ?? undefined,
    suites: inteiro(mk(MK.SUITES, CAMPOS_WP.SUITES)) ?? undefined,
    banheiros: inteiro(mk(MK.BANHEIROS, CAMPOS_WP.BANHEIRO)) ?? undefined,
    vagasGaragem: inteiro(mk(MK.GARAGEM, CAMPOS_WP.GARAGEM)) ?? undefined,
    endereco: meta.get("address") || undefined,
    latitude: numeroBr(meta.get("latitude")) ?? undefined,
    longitude: numeroBr(meta.get("longitude")) ?? undefined,
    cidadeId,
    bairroId,
    proprietarioObs: observacao
  };

  let imovel;
  try {
    imovel = await prisma.imovel.create({
      data: {
        imobiliariaId,
        origemWpId: wpId,
        codigo: codigoBase,
        codigoAutomatico: false,
        ...dadosBase
      }
    });
  } catch (erroCriacao: any) {
    // Código colidiu com outro imóvel já cadastrado nesta imobiliária — tenta
    // de novo com um sufixo que garante unicidade, em vez de abortar o
    // anúncio inteiro.
    if (erroCriacao?.code === "P2002") {
      imovel = await prisma.imovel.create({
        data: {
          imobiliariaId,
          origemWpId: wpId,
          codigo: `${codigoBase}-${wpId}`,
          codigoAutomatico: false,
          ...dadosBase
        }
      });
    } else {
      throw erroCriacao;
    }
  }

  await importarFotos(imobiliariaId, imovel.id, wpId, meta, pool, prefixo);
}

async function importarFotos(
  imobiliariaId: string,
  imovelId: string,
  wpId: number,
  meta: Map<string, string>,
  pool: ReturnType<typeof poolWp>,
  prefixo: string
) {
  const capaId = inteiro(meta.get("_thumbnail_id"));
  const imagensMetaKey = process.env.WP_META_IMAGENS || null;
  let ordemGaleria = imagensMetaKey
    ? extrairUidsDeImagesWp(meta.get(imagensMetaKey))      // RTCL Pro: campo "images" com array de objetos
    : extrairIdsDeArrayPhpSerializado(meta.get("_rtcl_attachments_order")); // Delta: array de inteiros

  // Fallback: quando o campo "images" armazena apenas o contador (ex: "18") em vez
  // do array serializado, extrairUidsDeImagesWp retorna []. Nesse caso buscamos
  // os attachments pelo post_parent diretamente no banco do WordPress.
  if (ordemGaleria.length === 0 && imagensMetaKey) {
    const [childRows] = await pool.query<any[]>(
      `SELECT ID FROM ${prefixo}posts
       WHERE post_parent = ? AND post_type = 'attachment' AND post_status = 'inherit'
       ORDER BY ID ASC`,
      [wpId]
    );
    ordemGaleria = childRows.map((r: any) => r.ID as number);
  }

  const idsOrdenados: number[] = [];
  if (capaId) idsOrdenados.push(capaId);
  for (const id of ordemGaleria) {
    if (!idsOrdenados.includes(id)) idsOrdenados.push(id);
  }
  if (idsOrdenados.length === 0) return;

  const [attRows] = await pool.query<any[]>(
    `SELECT ID, guid FROM ${prefixo}posts WHERE ID IN (${idsOrdenados.map(() => "?").join(",")})`,
    idsOrdenados
  );
  const guidPorId = new Map<number, string>(attRows.map((r: any) => [r.ID, r.guid]));

  const wpUploadsDir = process.env.WP_UPLOADS_DIR;
  if (!wpUploadsDir) throw new Error("WP_UPLOADS_DIR não configurado no .env do servidor.");

  const pastaDestino = caminhoUploads(imobiliariaId, "imoveis", imovelId);
  await fs.mkdir(pastaDestino, { recursive: true });

  let ordem = 0;
  for (const id of idsOrdenados) {
    const guid = guidPorId.get(id);
    if (!guid) continue;

    const marcador = "/uploads/";
    const posicao = guid.indexOf(marcador);
    if (posicao === -1) continue;
    const caminhoRelativo = guid.slice(posicao + marcador.length);

    const origemAbsoluta = path.join(wpUploadsDir, caminhoRelativo);

    try {
      // eslint-disable-next-line no-await-in-loop
      await fs.access(origemAbsoluta);
    } catch {
      // Arquivo referenciado não existe mais no disco — pula essa foto sem
      // travar a importação do resto do anúncio.
      continue;
    }

    const extensao = path.extname(caminhoRelativo) || ".jpg";
    const nomeArquivo = `wp-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${extensao}`;
    const destinoAbsoluto = path.join(pastaDestino, nomeArquivo);

    try {
      // eslint-disable-next-line no-await-in-loop
      await fs.copyFile(origemAbsoluta, destinoAbsoluto);
    } catch {
      continue;
    }

    const urlPublica = `/uploads/${imobiliariaId}/imoveis/${imovelId}/${nomeArquivo}`;

    // eslint-disable-next-line no-await-in-loop
    await prisma.foto.create({
      data: {
        imovelId,
        url: urlPublica,
        ordem,
        capa: ordem === 0
      }
    });
    ordem += 1;
  }
}
