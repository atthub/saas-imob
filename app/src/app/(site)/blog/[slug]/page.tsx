import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Tag, ArrowLeft, User } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

type ArtigoCompleto = {
  id: string; titulo: string; slug: string; resumo: string | null; conteudo: string;
  imagemCapaUrl: string | null; categoria: string | null; autor: string | null;
  publicadoEm: Date; metaDescricao: string | null; ativo: number | boolean;
};

async function getArtigo(slug: string): Promise<ArtigoCompleto | null> {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return null;
  try {
    const rows = await prisma.$queryRaw<ArtigoCompleto[]>`
      SELECT id, titulo, slug, resumo, conteudo, imagemCapaUrl, categoria, autor,
             publicadoEm, metaDescricao, ativo
      FROM artigos
      WHERE imobiliariaId = ${imobiliaria.id} AND slug = ${slug} AND ativo = 1
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artigo = await getArtigo(params.slug);
  if (!artigo) return {};

  const description = artigo.metaDescricao || artigo.resumo || undefined;
  return {
    title: artigo.titulo,
    description,
    openGraph: {
      title: artigo.titulo,
      description,
      type: "article",
      publishedTime: artigo.publicadoEm.toISOString(),
      ...(artigo.imagemCapaUrl ? { images: [{ url: artigo.imagemCapaUrl }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: artigo.titulo,
      description,
      ...(artigo.imagemCapaUrl ? { images: [artigo.imagemCapaUrl] } : {})
    }
  };
}

export default async function ArtigoPage({ params }: Props) {
  const artigo = await getArtigo(params.slug);
  if (!artigo) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-goldVivid transition mb-8">
        <ArrowLeft className="w-4 h-4" /> Voltar ao blog
      </Link>

      {artigo.imagemCapaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artigo.imagemCapaUrl} alt={artigo.titulo}
          className="w-full h-72 object-cover rounded-2xl mb-8 shadow-md" />
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
        {artigo.categoria && (
          <span className="flex items-center gap-1 text-brand-goldVivid font-medium">
            <Tag className="w-3.5 h-3.5" /> {artigo.categoria}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date(artigo.publicadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        {artigo.autor && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> {artigo.autor}
          </span>
        )}
      </div>

      <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark leading-tight mb-6">
        {artigo.titulo}
      </h1>

      {artigo.resumo && (
        <p className="text-lg text-gray-500 leading-relaxed mb-8 border-l-4 border-brand-gold pl-4">
          {artigo.resumo}
        </p>
      )}

      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed
          prose-headings:font-heading prose-headings:text-brand-dark
          prose-a:text-brand-goldVivid prose-a:no-underline hover:prose-a:underline
          prose-strong:text-brand-dark prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: artigo.conteudo }}
      />

      <div className="mt-12 pt-8 border-t text-center">
        <Link href="/blog" className="text-sm text-brand-goldVivid hover:underline font-medium">
          ← Ver todos os artigos
        </Link>
      </div>
    </div>
  );
}
