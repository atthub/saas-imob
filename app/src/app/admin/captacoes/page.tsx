import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import StatusCaptacaoSelect from "./_components/StatusCaptacaoSelect";
import CaptacaoFotosGaleria from "./_components/CaptacaoFotosGaleria";
import AceitarRecusarBotoes from "./_components/AceitarRecusarBotoes";
import ExcluirCaptacaoButton from "./_components/ExcluirCaptacaoButton";

export const dynamic = "force-dynamic";

const STATUS_COR: Record<string, string> = {
  novo: "bg-blue-50 text-blue-700",
  em_analise: "bg-amber-50 text-amber-700",
  aprovado: "bg-green-50 text-green-700",
  recusado: "bg-gray-100 text-gray-500"
};

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  recusado: "Recusado"
};

const FINALIDADE_LABEL: Record<string, string> = {
  venda: "Vender",
  locacao: "Alugar",
  ambos: "Vender ou alugar"
};

export default async function CaptacoesPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  // imovelCriado é uma relação nova — Prisma Client do servidor pode não a conhecer.
  // Tenta com include; se falhar, cai no fallback sem ela (imovelCriado = null).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let captacoes: any[];
  try {
    captacoes = await prisma.captacao.findMany({
      where: { imobiliariaId: sessao.imobiliariaId },
      include: { fotos: true, imovelCriado: { select: { id: true } } },
      orderBy: { criadoEm: "desc" }
    });
  } catch {
    captacoes = (await prisma.captacao.findMany({
      where: { imobiliariaId: sessao.imobiliariaId },
      include: { fotos: true },
      orderBy: { criadoEm: "desc" }
    })).map((c) => ({ ...c, imovelCriado: null }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Captação de Imóveis</h1>
        <p className="text-sm text-gray-500">
          Imóveis enviados por proprietários pelo formulário público do site ("Anuncie seu imóvel").
        </p>
      </div>

      {captacoes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border px-4 py-6 text-center text-gray-400 text-sm">
          Nenhuma captação recebida ainda.
        </div>
      )}

      <div className="space-y-4">
        {captacoes.map((captacao) => (
          <div key={captacao.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-brand-dark">{captacao.nomeProprietario}</h3>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_COR[captacao.status]}`}>
                    {STATUS_LABEL[captacao.status] || captacao.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {captacao.telefone}
                  {captacao.email ? ` · ${captacao.email}` : ""}
                </p>
              </div>
              <StatusCaptacaoSelect id={captacao.id} statusAtual={captacao.status} />
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
              {captacao.tipoImovel && <p><span className="text-gray-400">Tipo:</span> {captacao.tipoImovel}</p>}
              {captacao.finalidade && (
                <p>
                  <span className="text-gray-400">Finalidade:</span>{" "}
                  {FINALIDADE_LABEL[captacao.finalidade] || captacao.finalidade}
                </p>
              )}
              {captacao.valorPretendido && (
                <p><span className="text-gray-400">Valor pretendido:</span> {captacao.valorPretendido}</p>
              )}
              {(captacao.endereco || captacao.bairro || captacao.cidade) && (
                <p>
                  <span className="text-gray-400">Endereço:</span>{" "}
                  {[captacao.endereco, captacao.bairro, captacao.cidade].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            {captacao.descricao && (
              <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{captacao.descricao}</p>
            )}

            <CaptacaoFotosGaleria fotos={captacao.fotos} nomeProprietario={captacao.nomeProprietario} />

            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-xs text-gray-400">
                Recebido em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(captacao.criadoEm)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <AceitarRecusarBotoes id={captacao.id} status={captacao.status} imovelCriadoId={(captacao as any).imovelCriado?.id ?? null} />
                <ExcluirCaptacaoButton captacaoId={captacao.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
