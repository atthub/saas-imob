import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import Link from "next/link";
import LeadsView from "./_components/LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const [leads, corretores] = await Promise.all([
    prisma.lead.findMany({
      where: { imobiliariaId: sessao.imobiliariaId },
      include: {
        imovel: { select: { id: true, titulo: true, codigo: true } },
        corretor: { select: { id: true, nome: true } },
        // promocao removida do include: relação nova — Prisma Client do servidor não a conhece
      },
      orderBy: { criadoEm: "desc" }
    }),
    prisma.corretor.findMany({
      where: { imobiliariaId: sessao.imobiliariaId, ativo: true },
      orderBy: { nome: "asc" }
    })
  ]);

  // Busca dados de promoção via $queryRawUnsafe (parâmetros explícitos — forma confiável neste servidor)
  const promoMap: Record<string, { id: string; titulo: string }> = {};
  try {
    const promoRows = await prisma.$queryRawUnsafe<Array<{ leadId: string; promoId: string; promoTitulo: string }>>(
      `SELECT l.id AS leadId, p.id AS promoId, p.titulo AS promoTitulo
       FROM leads l
       INNER JOIN promocoes p ON l.promocaoId = p.id
       WHERE l.imobiliariaId = ? AND l.promocaoId IS NOT NULL`,
      sessao.imobiliariaId
    );
    for (const r of promoRows) {
      promoMap[r.leadId] = { id: r.promoId, titulo: r.promoTitulo };
    }
  } catch {
    // promocaoId ainda não existe no banco — ignora
  }

  // Serializa datas para string (Server → Client Component)
  const leadsSerialized = leads.map((l) => ({
    ...l,
    criadoEm: l.criadoEm.toISOString(),
    direcionadoEm: l.direcionadoEm?.toISOString() ?? null,
    promocao: promoMap[l.id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Leads</h1>
        <p className="text-sm text-gray-500">
          Acompanhe os interessados que chegaram pelo site e encaminhe cada um para um corretor.
        </p>
      </div>

      {corretores.length === 0 && (
        <div className="bg-amber-50 text-amber-700 text-sm rounded-md px-4 py-3">
          Nenhum corretor ativo cadastrado ainda. Cadastre corretores em{" "}
          <Link href="/admin/corretores" className="underline font-medium">
            Corretores
          </Link>{" "}
          para poder encaminhar os leads.
        </div>
      )}

      <LeadsView
        leads={leadsSerialized as any}
        corretores={corretores.map((c) => ({ id: c.id, nome: c.nome }))}
      />
    </div>
  );
}
