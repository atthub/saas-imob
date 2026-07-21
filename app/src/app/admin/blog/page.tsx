import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import Link from "next/link";
import ExcluirArtigoButton from "./_components/ExcluirArtigoButton";
import { Plus, Pencil } from "lucide-react";

export default async function BlogAdminPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return null;

  type ArtigoAdmin = { id: string; titulo: string; slug: string; categoria: string | null; ativo: boolean | number; publicadoEm: Date; imagemCapaUrl: string | null };
  let artigos: ArtigoAdmin[] = [];
  try {
    artigos = await prisma.$queryRaw<ArtigoAdmin[]>`
      SELECT id, titulo, slug, categoria, ativo, publicadoEm, imagemCapaUrl
      FROM artigos
      WHERE imobiliariaId = ${sessao.imobiliariaId}
      ORDER BY publicadoEm DESC
    `;
  } catch { artigos = []; }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Blog</h1>
          <p className="text-sm text-gray-500">Artigos publicados no site público com SEO avançado.</p>
        </div>
        <Link href="/admin/blog/novo"
          className="flex items-center gap-2 bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Novo artigo
        </Link>
      </div>

      {artigos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Nenhum artigo publicado ainda.</p>
          <Link href="/admin/blog/novo" className="mt-3 inline-block text-sm text-brand-goldVivid hover:underline">
            Criar primeiro artigo →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {artigos.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 flex gap-4 items-start ${!a.ativo ? "opacity-60" : ""}`}>
              {a.imagemCapaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imagemCapaUrl} alt={a.titulo} className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-brand-dark text-sm">{a.titulo}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {a.ativo ? "Publicado" : "Rascunho"}
                  </span>
                  {a.categoria && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{a.categoria}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  /{a.slug} · {new Date(a.publicadoEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link href={`/admin/blog/${a.id}`} title="Editar"
                  className="p-2 rounded-md text-blue-500 hover:bg-blue-50 transition">
                  <Pencil className="w-4 h-4" />
                </Link>
                <ExcluirArtigoButton id={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
