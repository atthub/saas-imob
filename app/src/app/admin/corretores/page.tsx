import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import ExcluirCorretorButton from "./_components/ExcluirCorretorButton";

export default async function CorretoresPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const corretores = await prisma.corretor.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { leads: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Corretores</h1>
          <p className="text-sm text-gray-500">
            Cadastre os corretores da equipe para poder encaminhar leads para eles.
          </p>
        </div>
        <Link
          href="/admin/corretores/novo"
          className="bg-brand-goldVivid hover:opacity-90 text-white text-sm font-semibold rounded-md px-4 py-2 transition"
        >
          Novo corretor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {corretores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Nenhum corretor cadastrado ainda.
                </td>
              </tr>
            )}
            {corretores.map((corretor) => (
              <tr key={corretor.id} className="border-t">
                <td className="px-4 py-3">{corretor.nome}</td>
                <td className="px-4 py-3 text-gray-500">{corretor.telefone}</td>
                <td className="px-4 py-3 text-gray-500">{corretor.email || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{corretor._count.leads}</td>
                <td className="px-4 py-3">
                  {corretor.ativo ? (
                    <span className="text-green-600 text-xs font-medium">Ativo</span>
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link href={`/admin/corretores/${corretor.id}/editar`} className="text-brand-goldVivid hover:underline">
                    Editar
                  </Link>
                  <ExcluirCorretorButton corretorId={corretor.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
