import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import Link from "next/link";
import DashboardCompartilhar from "./_components/DashboardCompartilhar";

export const dynamic = "force-dynamic";

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function barWidth(valor: number, max: number) {
  if (max === 0) return "0%";
  return `${Math.round((valor / max) * 100)}%`;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { semPermissao?: string };
}) {
  const sessao = await obterSessaoAtual();
  const imobiliariaId = sessao?.imobiliariaId;

  // --- Dados resumo ---
  const [totalImoveis, totalLeads, totalDestaques, imoveisPorStatus, ultimosImoveis] =
    await Promise.all([
      imobiliariaId ? prisma.imovel.count({ where: { imobiliariaId } }) : 0,
      imobiliariaId ? prisma.lead.count({ where: { imobiliariaId } }) : 0,
      imobiliariaId ? prisma.imovel.count({ where: { imobiliariaId, destaque: true } }) : 0,
      imobiliariaId
        ? prisma.imovel.groupBy({
            by: ["status"],
            where: { imobiliariaId },
            _count: { id: true }
          })
        : [],
      imobiliariaId
        ? prisma.imovel.findMany({
            where: { imobiliariaId },
            include: { fotos: { where: { capa: true }, take: 1 } },
            orderBy: { criadoEm: "desc" },
            take: 10
          })
        : []
    ]);

  // --- Leads por mês (últimos 6 meses) ---
  const agora = new Date();
  const meses: { label: string; inicio: Date; fim: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    meses.push({
      label: d.toLocaleString("pt-BR", { month: "short" }),
      inicio: d,
      fim
    });
  }

  const contagensLeads = await Promise.all(
    meses.map((m) =>
      imobiliariaId
        ? prisma.lead.count({
            where: { imobiliariaId, criadoEm: { gte: m.inicio, lt: m.fim } }
          })
        : Promise.resolve(0)
    )
  );

  const maxLeads = Math.max(...contagensLeads, 1);

  const STATUS_LABEL: Record<string, string> = {
    DISPONIVEL: "Disponível",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
    ALUGADO: "Alugado",
    INATIVO: "Inativo"
  };
  const STATUS_COR: Record<string, string> = {
    DISPONIVEL: "bg-green-500",
    RESERVADO: "bg-amber-400",
    VENDIDO: "bg-blue-500",
    ALUGADO: "bg-purple-500",
    INATIVO: "bg-gray-300"
  };

  const maxStatus = Math.max(
    ...imoveisPorStatus.map((s) => s._count.id),
    1
  );

  const cards = [
    { label: "Imóveis cadastrados", valor: totalImoveis },
    { label: "Leads recebidos", valor: totalLeads },
    { label: "Imóveis em destaque", valor: totalDestaques }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>

      {searchParams?.semPermissao && (
        <div className="bg-amber-50 text-amber-700 text-sm rounded-md px-3 py-2">
          Você não tem permissão para acessar essa seção do painel. Fale com um administrador.
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-brand-dark mt-1">{card.valor}</p>
          </div>
        ))}
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Leads por mês */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-brand-dark mb-4">Leads por mês</h2>
          <div className="space-y-2">
            {meses.map((m, i) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8 shrink-0 capitalize">{m.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 bg-brand-goldVivid rounded-full transition-all"
                    style={{ width: barWidth(contagensLeads[i], maxLeads) }}
                  />
                </div>
                <span className="text-xs font-semibold text-brand-dark w-5 text-right">
                  {contagensLeads[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Imóveis por status */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-brand-dark mb-4">Imóveis por status</h2>
          {imoveisPorStatus.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum imóvel cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {imoveisPorStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">
                    {STATUS_LABEL[s.status] || s.status}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all ${STATUS_COR[s.status] || "bg-gray-400"}`}
                      style={{ width: barWidth(s._count.id, maxStatus) }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-brand-dark w-5 text-right">
                    {s._count.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos 10 imóveis */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-dark">Últimos imóveis cadastrados</h2>
          <Link href="/admin/imoveis" className="text-sm text-brand-goldVivid hover:underline">
            Ver todos →
          </Link>
        </div>
        {ultimosImoveis.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum imóvel cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ultimosImoveis.map((imovel) => {
              const foto = imovel.fotos[0];
              return (
                <div key={imovel.id} className="rounded-lg border overflow-hidden bg-gray-50 flex flex-col">
                  {/* Miniatura */}
                  <div className="relative h-28 bg-gray-200">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto.url}
                        alt={imovel.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sem foto
                      </div>
                    )}
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {imovel.codigo}
                    </span>
                  </div>
                  {/* Info + botões */}
                  <div className="p-2 flex flex-col gap-1.5 flex-1">
                    <p className="text-xs font-medium text-brand-dark leading-tight line-clamp-2">
                      {imovel.titulo}
                    </p>
                    <div className="flex gap-1.5 mt-auto">
                      <DashboardCompartilhar codigo={imovel.codigo} titulo={imovel.titulo} />
                      <Link
                        href={`/admin/imoveis/${imovel.id}/editar`}
                        className="flex-1 text-center text-[10px] font-semibold bg-brand-goldVivid text-white rounded py-1 hover:opacity-90"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
