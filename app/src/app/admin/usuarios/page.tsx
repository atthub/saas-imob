import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import ExcluirUsuarioButton from "./_components/ExcluirUsuarioButton";

const PAPEL_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  CORRETOR: "Corretor"
};

export default async function UsuariosPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const usuarios = await prisma.usuario.findMany({
    where: { imobiliariaId: sessao.imobiliariaId, papel: { not: "SUPER_ADMIN" } },
    orderBy: { criadoEm: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Usuários</h1>
          <p className="text-sm text-gray-500">Gerencie quem acessa o painel e o que cada um pode fazer.</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="bg-brand-goldVivid hover:opacity-90 text-white text-sm font-semibold rounded-md px-4 py-2 transition"
        >
          Novo usuário
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-t">
                <td className="px-4 py-3">{usuario.nome}</td>
                <td className="px-4 py-3 text-gray-500">{usuario.email}</td>
                <td className="px-4 py-3">{PAPEL_LABEL[usuario.papel] || usuario.papel}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link href={`/admin/usuarios/${usuario.id}/editar`} className="text-brand-goldVivid hover:underline">
                    Editar
                  </Link>
                  {usuario.id !== sessao.usuarioId && <ExcluirUsuarioButton usuarioId={usuario.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
