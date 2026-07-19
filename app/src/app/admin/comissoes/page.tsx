import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExcluirComissaoButton from "./_components/ExcluirComissaoButton";
import MarcarPagoButton from "./_components/MarcarPagoButton";

export const dynamic = "force-dynamic";

function fmt(valor: number | unknown) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComissoesPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;
  if (sessao.papel === "CORRETOR") redirect("/admin");

  const [comissoes, corretores] = await Promise.all([
    prisma.comissao.findMany({
      where: { imobiliariaId: sessao.imobiliariaId },
      include: {
        imovel: { select: { id: true, titulo: true, codigo: true } },
        corretor: { select: { id: true, nome: true } }
      },
      orderBy: { criadoEm: "desc" }
    }),
    prisma.corretor.findMany({
      where: { imobiliariaId: sessao.imobiliariaId, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" }
    })
  ]);

  type C = { valorComissao: unknown; valorTerceiros: unknown; status: string; corretor?: { id: string; nome: string } | null };
  const totalComissoes = (comissoes as C[]).reduce((acc, c) => acc + Number(c.valorComissao), 0);
  const totalTerceiros = (comissoes as C[]).reduce((acc, c) => acc + Number(c.valorTerceiros), 0);
  const totalPendente = (comissoes as C[]).filter((c) => c.status === "pendente").reduce((acc, c) => acc + Number(c.valorComissao), 0);
  const totalPago = (comissoes as C[]).filter((c) => c.status === "pago").reduce((acc, c) => acc + Number(c.valorComissao), 0);

  // Resumo por corretor
  type ResumoCorretor = { nome: string; total: number; pendente: number; pago: number; quantidade: number };
  const resumoPorCorretor = new Map<string, ResumoCorretor>();
  for (const c of comissoes as C[]) {
    const nomeCorretor = c.corretor?.nome || "Sem corretor";
    const chave = c.corretor?.id || "__sem_corretor__";
    const atual = resumoPorCorretor.get(chave) || { nome: nomeCorretor, total: 0, pendente: 0, pago: 0, quantidade: 0 };
    atual.total += Number(c.valorComissao);
    atual.quantidade += 1;
    if (c.status === "pendente") atual.pendente += Number(c.valorComissao);
    else atual.pago += Number(c.valorComissao);
    resumoPorCorretor.set(chave, atual);
  }
  const rankingCorretores = Array.from(resumoPorCorretor.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Comissões</h1>
          <p className="text-sm text-gray-500">Registro de vendas/locações e cálculo automático de comissões.</p>
        </div>
        <Link
          href="/admin/comissoes/nova"
          className="bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90"
        >
          + Nova comissão
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Total de comissões</p>
          <p className="text-xl font-bold text-brand-dark">{fmt(totalComissoes)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Comissão de terceiros</p>
          <p className="text-xl font-bold text-brand-dark">{fmt(totalTerceiros)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl shadow p-4">
          <p className="text-xs text-amber-700 mb-1">Pendente de recebimento</p>
          <p className="text-xl font-bold text-amber-700">{fmt(totalPendente)}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow p-4">
          <p className="text-xs text-green-700 mb-1">Já recebido</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalPago)}</p>
        </div>
      </div>

      {/* Resumo por corretor */}
      {rankingCorretores.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-brand-dark">Desempenho por corretor</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs">
              <tr>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3">Transações</th>
                <th className="px-4 py-3">Total comissões</th>
                <th className="px-4 py-3 text-amber-600">Pendente</th>
                <th className="px-4 py-3 text-green-600">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {rankingCorretores.map((r) => (
                <tr key={r.nome} className="border-t">
                  <td className="px-4 py-3 font-medium text-brand-dark">{r.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{r.quantidade}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{fmt(r.total)}</td>
                  <td className="px-4 py-3 font-mono text-amber-600">{fmt(r.pendente)}</td>
                  <td className="px-4 py-3 font-mono text-green-600">{fmt(r.pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {comissoes.length === 0 && (
        <div className="text-center text-gray-400 text-sm border border-dashed rounded-xl py-12">
          Nenhuma comissão registrada ainda.{" "}
          <Link href="/admin/comissoes/nova" className="text-brand-goldVivid underline">Registrar primeira</Link>
        </div>
      )}

      {comissoes.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs">
              <tr>
                <th className="px-4 py-3">Descrição / Imóvel</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3">Valor imóvel</th>
                <th className="px-4 py-3">Comissão (6%)</th>
                <th className="px-4 py-3">Terceiros (30%)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c: typeof comissoes[0]) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-dark">{c.descricao || "—"}</p>
                    {c.imovel && (
                      <p className="text-xs text-gray-400">{c.imovel.codigo} · {c.imovel.titulo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${c.tipo === "VENDA" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {c.tipo === "VENDA" ? "Venda" : "Locação"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.corretor?.nome || "—"}</td>
                  <td className="px-4 py-3 font-mono">{fmt(c.valorImovel)}</td>
                  <td className="px-4 py-3 font-mono text-brand-dark font-semibold">{fmt(c.valorComissao)}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{fmt(c.valorTerceiros)}</td>
                  <td className="px-4 py-3">
                    {c.status === "pago" ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-medium rounded-full px-2 py-0.5">Pago</span>
                    ) : (
                      <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium rounded-full px-2 py-0.5">Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/comissoes/${c.id}`} className="text-brand-goldVivid">Editar</Link>
                    {c.status === "pendente" && <MarcarPagoButton id={c.id} />}
                    <ExcluirComissaoButton id={c.id} />
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
