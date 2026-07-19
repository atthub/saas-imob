import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { registrarAuditoria } from "@/lib/auditoria";
import { gerarCodigoAutomatico } from "@/lib/codigoImovel";
import { encontrarOuCriarProprietario } from "@/lib/proprietarios";
import { caminhoUploads } from "@/lib/watermark";

const TIPO_IMOVEL_MAP: Record<string, string> = {
  casa: "CASA",
  apartamento: "APARTAMENTO",
  terreno: "TERRENO",
  "sala comercial": "SALA_COMERCIAL",
  galpão: "GALPAO",
  galpao: "GALPAO",
  chácara: "CHACARA",
  chacara: "CHACARA",
  kitnet: "KITNET",
  outro: "OUTRO"
};

const FINALIDADE_MAP: Record<string, string> = {
  venda: "VENDA",
  locacao: "LOCACAO",
  ambos: "VENDA_E_LOCACAO"
};

function mapearTipoImovel(valor: string | null) {
  if (!valor) return "OUTRO";
  return TIPO_IMOVEL_MAP[valor.trim().toLowerCase()] || "OUTRO";
}

function mapearFinalidade(valor: string | null) {
  if (!valor) return "VENDA";
  return FINALIDADE_MAP[valor.trim().toLowerCase()] || "VENDA";
}

// Tenta extrair um valor numérico de um texto livre como "R$ 350.000" ou
// "350000,00 negociável". Se não conseguir, devolve null (o valor original
// continua disponível na descrição do imóvel para a imobiliária revisar).
function tentarExtrairValor(valorTexto: string | null) {
  if (!valorTexto) return null;
  const apenasNumeros = valorTexto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3},)/g, "");
  const normalizado = apenasNumeros.replace(/\.(?=\d{3}$)/g, "").replace(",", ".");
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// POST /api/captacoes/[id]/aceitar -> cria um imóvel rascunho (status
// INATIVO, fora da vitrine pública) a partir dos dados enviados pelo
// proprietário, vincula/cria o cadastro de Proprietario e copia as fotos
// enviadas para a pasta padrão de fotos do imóvel.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para aceitar captações." }, { status: 403 });
  }

  const captacao = await prisma.captacao.findUnique({
    where: { id: params.id },
    include: { fotos: true, imovelCriado: { select: { id: true } } }
  });

  if (!captacao || captacao.imobiliariaId !== sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Captação não encontrada." }, { status: 404 });
  }
  if (captacao.imovelCriado) {
    return NextResponse.json({ erro: "Esta captação já foi aceita." }, { status: 409 });
  }

  const proprietario = await encontrarOuCriarProprietario({
    imobiliariaId: sessao.imobiliariaId,
    nome: captacao.nomeProprietario,
    telefone: captacao.telefone,
    email: captacao.email,
    observacoes: null
  });

  const codigo = await gerarCodigoAutomatico(sessao.imobiliariaId);
  const tipo = mapearTipoImovel(captacao.tipoImovel);
  const finalidade = mapearFinalidade(captacao.finalidade);
  const valorExtraido = tentarExtrairValor(captacao.valorPretendido);

  const localizacaoTexto = [captacao.endereco, captacao.bairro, captacao.cidade].filter(Boolean).join(", ");
  const notasCaptacao = [
    "--- Informações enviadas pelo proprietário na captação online ---",
    localizacaoTexto ? `Localização informada: ${localizacaoTexto}` : null,
    captacao.valorPretendido ? `Valor pretendido informado: ${captacao.valorPretendido}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const descricaoFinal = [captacao.descricao, notasCaptacao].filter(Boolean).join("\n\n");

  const titulo = localizacaoTexto
    ? `Imóvel captado em ${localizacaoTexto}`
    : `Imóvel captado — ${captacao.nomeProprietario}`;

  const imovel = await prisma.imovel.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      codigo,
      codigoAutomatico: true,
      titulo,
      descricao: descricaoFinal || undefined,
      tipo: tipo as never,
      finalidade: finalidade as never,
      status: "INATIVO",
      valorVenda: finalidade !== "LOCACAO" ? valorExtraido ?? undefined : undefined,
      valorLocacao: finalidade !== "VENDA" ? valorExtraido ?? undefined : undefined,
      endereco: captacao.endereco || undefined,
      proprietarioId: proprietario.id,
      proprietarioNome: proprietario.nome,
      proprietarioTelefone: proprietario.telefone,
      proprietarioEmail: proprietario.email || undefined,
      captacaoOrigemId: captacao.id
    }
  });

  // Copia as fotos enviadas pelo proprietário (em uploads/<tenant>/captacoes/<id>)
  // para a pasta padrão de fotos do imóvel, criando os registros de Foto.
  let indiceFoto = 0;
  for (const foto of captacao.fotos) {
    try {
      const nomeOriginal = path.basename(foto.url);
      const caminhoOrigem = caminhoUploads(...caminhoRelativoParaPartes(foto.url));
      const pastaDestino = caminhoUploads(sessao.imobiliariaId, "imoveis", imovel.id);
      await fs.mkdir(pastaDestino, { recursive: true });
      const caminhoDestino = path.join(pastaDestino, nomeOriginal);
      await fs.copyFile(caminhoOrigem, caminhoDestino);

      const urlPublica = `/uploads/${sessao.imobiliariaId}/imoveis/${imovel.id}/${nomeOriginal}`;
      await prisma.foto.create({
        data: { imovelId: imovel.id, url: urlPublica, ordem: indiceFoto, capa: indiceFoto === 0 }
      });
      indiceFoto += 1;
    } catch (erro) {
      console.error("Falha ao copiar foto da captação para o imóvel:", erro);
    }
  }

  await prisma.captacao.update({ where: { id: captacao.id }, data: { status: "aprovado" } });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "CAPTACAO_ACEITA",
      entidade: "captacao",
      entidadeId: captacao.id,
      detalhes: { proprietario: captacao.nomeProprietario, imovelId: imovel.id },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ imovel });
}

function caminhoRelativoParaPartes(urlPublica: string): string[] {
  const semBarraInicial = urlPublica.replace(/^\/?uploads\//, "");
  return semBarraInicial.split("/");
}
