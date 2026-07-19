import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Megaphone } from "lucide-react";
import FormLeadPromocao from "../_components/FormLeadPromocao";

export const dynamic = "force-dynamic";

export default async function PromocaoDetalhePage({ params }: { params: { id: string } }) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return notFound();

  type PromoRow = {
    id: string;
    titulo: string;
    subtitulo: string | null;
    descricao: string | null;
    imagemUrl: string | null;
    imagemUrlMobile: string | null;
    tipoLink: string | null;
    codigoImovel: string | null;
    link: string | null;
    captarLeads: number;
    ativo: number;
    dataInicio: Date | null;
    dataFim: Date | null;
  };

  // Tenta query com campos novos; se colunas não existirem, cai no fallback com campos seguros
  // Usa $queryRawUnsafe (parâmetros explícitos) — forma confiável neste servidor Phusion Passenger
  let p: PromoRow | undefined;
  try {
    const rows = await prisma.$queryRawUnsafe<PromoRow[]>(
      `SELECT id, titulo, subtitulo, descricao, imagemUrl, imagemUrlMobile,
              tipoLink, codigoImovel, link, captarLeads, ativo, dataInicio, dataFim
       FROM promocoes
       WHERE id = ? AND imobiliariaId = ?
       LIMIT 1`,
      params.id, imobiliaria.id
    );
    p = rows[0];
  } catch {
    // Fallback: busca apenas colunas seguras (sem campos novos que podem não existir)
    const rows = await prisma.$queryRawUnsafe<PromoRow[]>(
      `SELECT id, titulo, subtitulo, descricao, imagemUrl,
              NULL AS imagemUrlMobile, NULL AS tipoLink, NULL AS codigoImovel,
              link, 0 AS captarLeads, ativo, dataInicio, dataFim
       FROM promocoes
       WHERE id = ? AND imobiliariaId = ?
       LIMIT 1`,
      params.id, imobiliaria.id
    );
    p = rows[0];
  }

  if (!p || !p.ativo) return notFound();

  // Verifica validade por data
  const agora = new Date();
  if (p.dataInicio && new Date(p.dataInicio) > agora) return notFound();
  if (p.dataFim && new Date(p.dataFim) < agora) return notFound();

  const captarLeads = p.captarLeads === 1;

  // Resolução do link de destino
  let linkDestino: string | null = null;
  if (p.tipoLink === "externo" && p.link) {
    linkDestino = p.link;
  } else if (p.tipoLink === "imovel" && p.codigoImovel) {
    // Tenta encontrar o imóvel pelo código para link direto; fallback para busca
    try {
      const imovel = await prisma.imovel.findFirst({
        where: { imobiliariaId: imobiliaria.id, codigo: p.codigoImovel! },
        select: { id: true }
      });
      linkDestino = imovel
        ? `/imoveis/${imovel.id}`
        : `/imoveis?busca=${encodeURIComponent(p.codigoImovel)}`;
    } catch {
      linkDestino = `/imoveis?busca=${encodeURIComponent(p.codigoImovel)}`;
    }
  }

  const temPeriodo = p.dataInicio || p.dataFim;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Voltar */}
      <Link
        href="/promocoes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-goldVivid mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às promoções
      </Link>

      {/* Hero da promoção */}
      {(p.imagemUrl || p.imagemUrlMobile) && (
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <picture>
            {p.imagemUrlMobile && (
              <source media="(max-width: 639px)" srcSet={p.imagemUrlMobile} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imagemUrl || p.imagemUrlMobile || ""}
              alt={p.titulo}
              className="w-full object-cover max-h-[420px]"
            />
          </picture>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-brand-goldVivid shrink-0" />
          <span className="text-sm font-semibold text-brand-goldVivid uppercase tracking-wide">
            Promoção exclusiva
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-brand-dark leading-tight mb-2">
          {p.titulo}
        </h1>
        {p.subtitulo && (
          <p className="text-lg text-gray-600">{p.subtitulo}</p>
        )}
        {temPeriodo && (
          <p className="text-xs text-gray-400 mt-2">
            Válido{" "}
            {p.dataInicio
              ? `de ${new Date(p.dataInicio).toLocaleDateString("pt-BR")}`
              : ""}
            {p.dataInicio && p.dataFim ? " " : ""}
            {p.dataFim
              ? `até ${new Date(p.dataFim).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        )}
      </div>

      {/* Descrição */}
      {p.descricao && (
        <div className="bg-white rounded-xl border p-6 mb-8 shadow-sm">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{p.descricao}</p>
        </div>
      )}

      {/* CTA */}
      {captarLeads ? (
        <FormLeadPromocao
          promocaoId={p.id}
          promocaoTitulo={p.titulo}
          imobiliariaId={imobiliaria.id}
        />
      ) : linkDestino ? (
        <Link
          href={linkDestino}
          {...(p.tipoLink === "externo" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-2 bg-brand-goldVivid text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition text-base"
        >
          {p.tipoLink === "imovel" ? "Ver imóvel" : "Acessar oferta"}
          <ArrowRight className="w-5 h-5" />
        </Link>
      ) : null}
    </div>
  );
}
