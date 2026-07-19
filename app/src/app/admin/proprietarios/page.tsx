import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { Phone, Mail, Plus } from "lucide-react";
import ExcluirProprietarioButton from "./_components/ExcluirProprietarioButton";

export const dynamic = "force-dynamic";

export default async function ProprietariosPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const proprietarios = await prisma.proprietario.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    include: { _count: { select: { imoveis: true } } },
    orderBy: { nome: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Proprietários</h1>
          <p className="text-sm text-gray-500">
            Cadastro de proprietários e os imóveis vinculados a cada um.
          </p>
        </div>
        <Link
          href="/admin/proprietarios/novo"
          className="flex items-center gap-2 bg-brand-goldVivid hover:opacity-90 text-white text-sm font-semibold rounded-md px-4 py-2 transition shrink-0"
        >
          <Plus size={16} /> Novo proprietário
        </Link>
      </div>

      {proprietarios.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border px-4 py-6 text-center text-gray-400 text-sm">
          Nenhum proprietário cadastrado ainda.{" "}
          <Link href="/admin/proprietarios/novo" className="underline text-brand-gold">Cadastre o primeiro</Link>{" "}
          ou aceite uma captação em{" "}
          <Link href="/admin/captacoes" className="underline">Captação de Imóveis</Link>.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {proprietarios.map((proprietario) => (
          <div key={proprietario.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition">
            <Link href={`/admin/proprietarios/${proprietario.id}`} className="flex-1 min-w-0">
              <p className="font-medium text-brand-dark">{proprietario.nome}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {proprietario.telefone}
                </span>
                {proprietario.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {proprietario.email}
                  </span>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                {proprietario._count.imoveis} imóve{proprietario._count.imoveis === 1 ? "l" : "is"}
              </span>
              <ExcluirProprietarioButton proprietarioId={proprietario.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
