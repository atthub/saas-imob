import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound } from "next/navigation";
import ArtigoForm from "../_components/ArtigoForm";

export default async function EditarArtigoPage({ params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return null;

  type ArtigoEdit = { id: string; titulo: string; slug: string; resumo: string | null; conteudo: string; imagemCapaUrl: string | null; categoria: string | null; autor: string | null; publicadoEm: Date; ativo: boolean | number; metaDescricao: string | null };
  let artigo: ArtigoEdit | null = null;
  try {
    const rows = await prisma.$queryRaw<ArtigoEdit[]>`
      SELECT id, titulo, slug, resumo, conteudo, imagemCapaUrl, categoria, autor, publicadoEm, ativo, metaDescricao
      FROM artigos WHERE id = ${params.id} AND imobiliariaId = ${sessao.imobiliariaId} LIMIT 1
    `;
    artigo = rows[0] ?? null;
  } catch { artigo = null; }

  if (!artigo) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Editar artigo</h1>
        <p className="text-sm text-gray-500">{artigo.titulo}</p>
      </div>
      <ArtigoForm artigo={{
        id: artigo.id,
        titulo: artigo.titulo,
        slug: artigo.slug,
        resumo: artigo.resumo ?? "",
        conteudo: artigo.conteudo,
        imagemCapaUrl: artigo.imagemCapaUrl ?? "",
        categoria: artigo.categoria ?? "",
        autor: artigo.autor ?? "",
        publicadoEm: new Date(artigo.publicadoEm).toISOString().slice(0, 16),
        ativo: Boolean(artigo.ativo),
        metaDescricao: artigo.metaDescricao ?? "",
      }} />
    </div>
  );
}
