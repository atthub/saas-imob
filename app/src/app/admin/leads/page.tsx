import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import Link from "next/link";
import LeadsView from "./_components/LeadsView";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { corretorId?: string };
}) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const isCorretor = sessao.papel === "CORRETOR";

  // Determina o filtro de corretor:
  // - CORRETOR logado → sempre filtra pelos próprios leads
  // - ADMIN/SUPER_ADMIN → usa o corretorId da URL, se houver
  let filtroCorretorId: string | undefined;
  let nomeCorretorFiltro: string | undefined;

  if (isCorretor) {
    const corretorLogado = await prisma.corretor.findFirst({
      where: { usuarioId: sessao.usuarioId, imobiliariaId: sessao.imobiliariaId },
      select: { id: true, nome: true }
    });
    if (corretorLogado) {
      filtroCorretorId = corretorLogado.id;
      nomeCorretorFiltro = corretorLogado.nome;
    }
  } else if (searchParams.corretorId) {
    filtroCorretorId = searchParams.corretorId;
    const c = await prisma.corretor.findFirst({
      where: { id: searchParams.corretorId, imobiliariaId: sessao.imobiliariaId },
      select: { nome: true }
    });
    if (c) nomeCorretorFiltro = c.nome;
  }

  const [leads, corretores] = await Promise.all([
    prisma.lead.findMany({
      where: {
        imobiliariaId: sessao.imobiliariaId,
        ...(filtroCorretorId ? { corretorId: filtroCorretorId } : {})
      },
      include: {
        imovel: { select: { id: true, titulo: true, codigo: true } },
        corretor: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" }
    }),
    prisma.corretor.findMany({
      where: { imobiliariaId: sessao.imobiliariaId, ativo: true },
      orderBy: { nome: "asc" }
    })
  ]);

  // Busca dados de promoção via $queryRawUnsafe
  const promoMap: Record<string, { id: string; titulo: string }> = {};
  try {
    const promoRows = await prisma.$queryRawUnsafe<Array<{ leadId: string; promoId: string; promoTitulo: string }>>(
      `SELECT l.id AS leadId, p.id AS promoId, p.titulo AS promoTitulo
       FROM leads l
       INNER JOIN promocoes p ON l.promocaoId = p.id
       WHERE l.imobiliariaId = ? AND l.promocaoId IS NOT NULL${filtroCorretorId ? " AND l.corretorId = ?" : ""}`,
      sessao.imobiliariaId,
      ...(filtroCorretorId ? [filtroCorretorId] : [])
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
          {isCorretor
            ? "Acompanhe os interessados encaminhados para você."
            : "Acompanhe os interessados que chegaram pelo site e encaminhe cada um para um corretor."}
        </p>
      </div>

      {/* Banner de filtro ativo (somente para admins com corretorId na URL) */}
      {!isCorretor && nomeCorretorFiltro && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          <span>
            Exibindo leads de <strong>{nomeCorretorFiltro}</strong>
          </span>
          <Link
            href="/admin/leads"
            className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtro
          </Link>
        </div>
      )}

      {!isCorretor && corretores.length === 0 && (
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
        modoCorretor={isCorretor}
      />
    </div>
  );
}
