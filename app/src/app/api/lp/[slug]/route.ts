import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const lp = await prisma.landingPage.findUnique({
    where: { slug: params.slug, status: "publicada" },
    include: {
      imovel: {
        include: {
          fotos: { orderBy: [{ capa: "desc" }, { ordem: "asc" }] },
          cidade: { select: { nome: true } },
          bairro: { select: { nome: true } },
          imobiliaria: {
            select: {
              nome: true,
              logoUrl: true,
              logoAltura: true,
              telefone: true,
              whatsapp: true,
              email: true,
              endereco: true,
              cidadePrincipal: true,
              creci: true
            }
          }
        }
      }
    }
  });

  if (!lp) return NextResponse.json(null, { status: 404 });

  // Retorna apenas os campos necessários (sem dados internos).
  // turnstileSiteKey é lido em runtime no servidor — correto para multi-tenant.
  return NextResponse.json({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
    titulo: lp.titulo,
    descricao: lp.descricao,
    cta: lp.cta,
    imovelId: lp.imovelId,
    imobiliariaId: lp.imobiliariaId,
    imovel: {
      id: lp.imovel.id,
      codigo: lp.imovel.codigo,
      titulo: lp.imovel.titulo,
      descricao: lp.imovel.descricao,
      quartos: lp.imovel.quartos,
      banheiros: lp.imovel.banheiros,
      vagasGaragem: lp.imovel.vagasGaragem,
      areaTotal: lp.imovel.areaTotal ? Number(lp.imovel.areaTotal) : null,
      valorVenda: lp.imovel.valorVenda ? Number(lp.imovel.valorVenda) : null,
      valorLocacao: lp.imovel.valorLocacao ? Number(lp.imovel.valorLocacao) : null,
      bairro: lp.imovel.bairro ? { nome: lp.imovel.bairro.nome } : null,
      cidade: lp.imovel.cidade ? { nome: lp.imovel.cidade.nome } : null,
      fotos: lp.imovel.fotos.map((f) => ({ url: f.url })),
      imobiliaria: lp.imovel.imobiliaria
    }
  });
}
