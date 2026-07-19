import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ACAO_LABEL: Record<string, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  IMOVEL_CRIADO: "Imóvel criado",
  IMOVEL_ATUALIZADO: "Imóvel atualizado",
  IMOVEL_EXCLUIDO: "Imóvel excluído",
  LEAD_DIRECIONADO: "Lead direcionado",
  LEAD_STATUS_ALTERADO: "Status do lead alterado",
  LEAD_EXCLUIDO: "Lead excluído",
  CORRETOR_CRIADO: "Corretor criado",
  CORRETOR_ATUALIZADO: "Corretor atualizado",
  CORRETOR_EXCLUIDO: "Corretor excluído",
  CORRETOR_DESATIVADO: "Corretor desativado",
  USUARIO_CRIADO: "Usuário criado",
  USUARIO_ATUALIZADO: "Usuário atualizado",
  USUARIO_EXCLUIDO: "Usuário excluído",
  CONFIGURACOES_ATUALIZADAS: "Configurações atualizadas",
  BANNER_ADICIONADO: "Banner adicionado",
  BANNER_EXCLUIDO: "Banner excluído",
  LANDING_PAGE_CRIADA: "Landing Page criada",
  LANDING_PAGE_PUBLICADA: "Landing Page publicada",
  LANDING_PAGE_EXCLUIDA: "Landing Page excluída",
  CAPTACAO_ACEITA: "Captação aceita",
  CAPTACAO_RECUSADA: "Captação recusada",
  PROPRIETARIO_CRIADO: "Proprietário criado",
  PROPRIETARIO_ATUALIZADO: "Proprietário atualizado",
  PROPRIETARIO_EXCLUIDO: "Proprietário excluído"
};

export default async function AuditoriaPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;
  if (sessao.papel === "CORRETOR") redirect("/admin");

  const registros = await prisma.registroAuditoria.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { criadoEm: "desc" },
    take: 200
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Auditoria</h1>
        <p className="text-sm text-gray-500">
          Histórico de ações realizadas no painel. Exibindo os 200 registros mais recentes.
        </p>
      </div>

      {registros.length === 0 && (
        <div className="text-center text-gray-400 text-sm border border-dashed rounded-xl py-10">
          Nenhum registro de auditoria ainda.
        </div>
      )}

      {registros.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(r.criadoEm).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-dark">{r.usuarioNome || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-brand-light text-brand-dark text-xs font-medium rounded-full px-2 py-0.5">
                      {ACAO_LABEL[r.acao] || r.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {r.entidade && r.entidadeId ? `${r.entidade} #${r.entidadeId.slice(0, 8)}` : ""}
                    {r.detalhes ? ` · ${r.detalhes.slice(0, 60)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
