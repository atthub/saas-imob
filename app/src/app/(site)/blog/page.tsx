import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import Link from "next/link";
import { BookOpen, CalendarDays, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return null;

  type ArtigoLista = { id: string; titulo: string; slug: string; resumo: string | null; imagemCapaUrl: string | null; categoria: string | null; autor: string | null; publicadoEm: Date };
  let artigos: ArtigoLista[] = [];
  try {
    artigos = await prisma.$queryRaw<ArtigoLista[]>`
      SELECT id, titulo, slug, resumo, imagemCapaUrl, categoria, autor, publicadoEm
      FROM artigos
      WHERE imobiliariaId = ${imobiliaria.id} AND ativo = 1
      ORDER BY publicadoEm DESC
    `;
  } catch { artigos = []; }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-10">
        <BookOpen className="w-7 h-7 text-brand-goldVivid" />
        <h1 className="font-heading text-3xl font-bold text-brand-dark">Blog</h1>
      </div>

      {artigos.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum artigo publicado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {artigos.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`}
              className="group bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition">
              {a.imagemCapaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imagemCapaUrl} alt={a.titulo}
                  className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-brand-dark to-brand-gold flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-white/40" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {a.categoria && (
                    <span className="flex items-center gap-1 text-xs text-brand-goldVivid font-medium">
                      <Tag className="w-3 h-3" /> {a.categoria}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(a.publicadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <h2 className="font-heading font-bold text-brand-dark text-base leading-snug mb-2 group-hover:text-brand-goldVivid transition line-clamp-2">
                  {a.titulo}
                </h2>
                {a.resumo && (
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">{a.resumo}</p>
                )}
                <p className="text-brand-goldVivid text-sm font-semibold mt-4">Ler artigo →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
