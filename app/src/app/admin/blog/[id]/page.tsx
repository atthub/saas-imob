import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound } from "next/navigation";
import ArtigoForm from "../_components/ArtigoForm";

export default async function EditarArtigoPage({ params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) return null;

  const artigo = await prisma.artigo.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });

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
        publicadoEm: artigo.publicadoEm.toISOString().slice(0, 16),
        ativo: artigo.ativo,
        metaDescricao: artigo.metaDescricao ?? "",
      }} />
    </div>
  );
}
