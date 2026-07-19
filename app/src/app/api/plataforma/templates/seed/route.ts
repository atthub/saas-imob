import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

const TEMPLATES = [
  {
    identificador: "classico",
    nome: "Clássico Imobiliário",
    descricao: "Visual tradicional, organizado, com destaque dourado."
  },
  {
    identificador: "colorido",
    nome: "Colorido Comercial",
    descricao: "Cores vibrantes, blocos de destaque, visual mais comercial."
  },
  {
    identificador: "compacto",
    nome: "Compacto",
    descricao: "Foco em busca rápida, grade densa de imóveis."
  },
  {
    identificador: "minimalista",
    nome: "Moderno Minimalista",
    descricao: "Bastante espaço em branco, tipografia fina, sem banner grande."
  },
  {
    identificador: "premium",
    nome: "Premium",
    descricao: "Tons escuros, detalhes dourados, visual sofisticado."
  },
  {
    identificador: "moderno-azul",
    nome: "Moderno Azul",
    descricao: "Inspirado nas grandes portais imobiliários: navbar azul royal, detalhes em laranja. Transmite autoridade e modernidade."
  },
  {
    identificador: "verde-natureza",
    nome: "Verde Natureza",
    descricao: "Paleta verde profunda com tons naturais. Ideal para imobiliárias com foco em imóveis de campo, chácaras e condomínios."
  },
  {
    identificador: "vermelho-comercial",
    nome: "Vermelho Comercial",
    descricao: "Identidade visual arrojada em vermelho e laranja. Visual de alto impacto para imobiliárias comerciais e de alto giro."
  },
  {
    identificador: "roxo-moderno",
    nome: "Roxo Moderno",
    descricao: "Gradiente roxo profundo com acentos em magenta. Layout contemporâneo para imobiliárias que querem se destacar."
  },
  {
    identificador: "cinza-corporativo",
    nome: "Cinza Corporativo",
    descricao: "Tons azul-acinzentados com destaques em verde-teal. Estilo sóbrio e profissional para imobiliárias corporativas."
  }
];

// POST /api/plataforma/templates/seed
// Idempotente: cria apenas os templates que ainda não existem no banco.
// Acessível apenas por SUPER_ADMIN.
export async function POST() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "SUPER_ADMIN") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const resultados: { identificador: string; status: "criado" | "ja_existia" }[] = [];

  for (const tpl of TEMPLATES) {
    const existente = await prisma.template.findUnique({
      where: { identificador: tpl.identificador }
    });
    if (existente) {
      resultados.push({ identificador: tpl.identificador, status: "ja_existia" });
    } else {
      await prisma.template.create({ data: tpl });
      resultados.push({ identificador: tpl.identificador, status: "criado" });
    }
  }

  return NextResponse.json({ ok: true, resultados });
}
