import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import ComissaoForm from "../_components/ComissaoForm";

export const dynamic = "force-dynamic";

export default async function EditarComissaoPage({ params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;
  if (sessao.papel === "CORRETOR") redirect("/admin");

  const [comissao, corretores, imoveis] = await Promise.all([
    prisma.comissao.findFirst({
      where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
    }),
    prisma.corretor.findMany({
      where: { imobiliariaId: sessao.imobiliariaId, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" }
    }),
    prisma.imovel.findMany({
      where: { imobiliariaId: sessao.imobiliariaId },
      select: { id: true, titulo: true, codigo: true },
      orderBy: { criadoEm: "desc" },
      take: 200
    })
  ]);

  if (!comissao) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Editar comissão</h1>
        <p className="text-sm text-gray-500">Altere os dados ou marque como pago.</p>
      </div>
      <ComissaoForm
        corretores={corretores}
        imoveis={imoveis}
        inicial={{
          id: comissao.id,
          descricao: comissao.descricao,
          tipo: comissao.tipo,
          valorImovel: Number(comissao.valorImovel),
          percentualComissao: Number(comissao.percentualComissao),
          percentualTerceiros: Number(comissao.percentualTerceiros),
          valorComissao: Number(comissao.valorComissao),
          valorTerceiros: Number(comissao.valorTerceiros),
          status: comissao.status,
          observacoes: comissao.observacoes,
          imovelId: comissao.imovelId,
          corretorId: comissao.corretorId,
          dataVenda: comissao.dataVenda
        }}
      />
    </div>
  );
}
