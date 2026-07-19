import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound } from "next/navigation";
import EditarProprietarioForm from "./_components/EditarProprietarioForm";
import VincularImovelForm from "./_components/VincularImovelForm";
import ImovelVinculadoItem from "./_components/ImovelVinculadoItem";

export const dynamic = "force-dynamic";

export default async function ProprietarioDetalhePage({ params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const proprietario = await prisma.proprietario.findUnique({
    where: { id: params.id },
    include: { imoveis: { select: { id: true, codigo: true, titulo: true, status: true } } }
  });

  if (!proprietario || proprietario.imobiliariaId !== sessao.imobiliariaId) return notFound();

  const imoveisSemProprietario = await prisma.imovel.findMany({
    where: { imobiliariaId: sessao.imobiliariaId, proprietarioId: null },
    select: { id: true, codigo: true, titulo: true },
    orderBy: { criadoEm: "desc" }
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{proprietario.nome}</h1>
        <p className="text-sm text-gray-500">Cadastro de proprietário e imóveis vinculados.</p>
      </div>

      <EditarProprietarioForm
        id={proprietario.id}
        inicial={{
          nome: proprietario.nome,
          telefone: proprietario.telefone,
          email: proprietario.email || "",
          observacoes: proprietario.observacoes || ""
        }}
      />

      <section className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Imóveis vinculados</h2>

        {proprietario.imoveis.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum imóvel vinculado ainda.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {proprietario.imoveis.map((imovel) => (
              <ImovelVinculadoItem key={imovel.id} proprietarioId={proprietario.id} imovel={imovel} />
            ))}
          </div>
        )}

        <VincularImovelForm proprietarioId={proprietario.id} imoveisDisponiveis={imoveisSemProprietario} />
      </section>
    </div>
  );
}
