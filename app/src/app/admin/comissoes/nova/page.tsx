import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { redirect } from "next/navigation";
import ComissaoForm from "../_components/ComissaoForm";

export const dynamic = "force-dynamic";

export default async function NovaComissaoPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;
  if (sessao.papel === "CORRETOR") redirect("/admin");

  const [corretores, imoveis] = await Promise.all([
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Nova comissão</h1>
        <p className="text-sm text-gray-500">Registre uma venda ou locação e calcule a comissão automaticamente.</p>
      </div>
      <ComissaoForm corretores={corretores} imoveis={imoveis} />
    </div>
  );
}
