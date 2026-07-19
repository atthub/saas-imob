import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import GerenciarPromocoes from "./_components/GerenciarPromocoes";

export default async function PromocoesPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return null;

  const promocoes = await prisma.promocao.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { ordem: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Promoções</h1>
        <p className="text-sm text-gray-500">
          Crie campanhas e ofertas especiais que aparecem na página inicial e na página pública de promoções.
        </p>
      </div>
      <GerenciarPromocoes
        inicial={promocoes.map((p) => ({
          ...p,
          dataInicio: p.dataInicio?.toISOString() ?? null,
          dataFim: p.dataFim?.toISOString() ?? null,
          tipoLink: p.tipoLink as "imovel" | "externo" | null,
        }))}
      />
    </div>
  );
}
