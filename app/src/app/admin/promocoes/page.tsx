import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import GerenciarPromocoes from "./_components/GerenciarPromocoes";

export default async function PromocoesPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let promocoes: any[] = [];
  try {
    promocoes = await prisma.$queryRaw`
      SELECT * FROM promocoes
      WHERE imobiliariaId = ${sessao.imobiliariaId}
      ORDER BY ordem ASC
    `;
  } catch { promocoes = []; }

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
          dataInicio: p.dataInicio ? new Date(p.dataInicio).toISOString() : null,
          dataFim: p.dataFim ? new Date(p.dataFim).toISOString() : null,
          tipoLink: p.tipoLink as "imovel" | "externo" | null,
          ativo: Boolean(p.ativo),
          captarLeads: Boolean(p.captarLeads),
        }))}
      />
    </div>
  );
}
