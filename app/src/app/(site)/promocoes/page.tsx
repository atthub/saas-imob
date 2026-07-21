import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromocoesPage() {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return null;

  const agora = new Date();
  type PromoLista = { id: string; titulo: string; subtitulo: string | null; descricao: string | null; imagemUrl: string | null; dataInicio: Date | null; dataFim: Date | null };
  let promocoes: PromoLista[] = [];
  try {
    promocoes = await prisma.$queryRaw<PromoLista[]>`
      SELECT id, titulo, subtitulo, descricao, imagemUrl, dataInicio, dataFim
      FROM promocoes
      WHERE imobiliariaId = ${imobiliaria.id} AND ativo = 1
        AND (
          (dataInicio IS NULL AND dataFim IS NULL)
          OR (dataInicio <= ${agora} AND dataFim IS NULL)
          OR (dataInicio IS NULL AND dataFim >= ${agora})
          OR (dataInicio <= ${agora} AND dataFim >= ${agora})
        )
      ORDER BY ordem ASC
    `;
  } catch { promocoes = []; }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-10">
        <Megaphone className="w-7 h-7 text-brand-goldVivid" />
        <h1 className="font-heading text-3xl font-bold text-brand-dark">Promoções exclusivas</h1>
      </div>

      {promocoes.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma promoção ativa no momento.</p>
          <p className="text-sm mt-1">Fique de olho — em breve teremos novidades!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {promocoes.map((p) => (
            <Link
              key={p.id}
              href={`/promocoes/${p.id}`}
              className="group bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              {p.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imagemUrl}
                  alt={p.titulo}
                  className="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div className="w-full h-52 bg-gradient-to-br from-brand-dark to-brand-gold flex items-center justify-center">
                  <Megaphone className="w-14 h-14 text-white/40" />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {(p.dataInicio || p.dataFim) && (
                  <p className="text-xs text-gray-400 mb-2">
                    Válido{" "}
                    {p.dataInicio ? `de ${new Date(p.dataInicio).toLocaleDateString("pt-BR")}` : ""}
                    {p.dataInicio && p.dataFim ? " " : ""}
                    {p.dataFim ? `até ${new Date(p.dataFim).toLocaleDateString("pt-BR")}` : ""}
                  </p>
                )}
                <h2 className="font-heading text-xl font-bold text-brand-dark mb-1 group-hover:text-brand-goldVivid transition-colors">
                  {p.titulo}
                </h2>
                {p.subtitulo && (
                  <p className="text-brand-goldVivid font-medium text-sm mb-3">{p.subtitulo}</p>
                )}
                {p.descricao && (
                  <p className="text-gray-600 text-sm leading-relaxed flex-1 line-clamp-3">{p.descricao}</p>
                )}
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-goldVivid">
                  Ver detalhes <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
