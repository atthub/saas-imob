// Script de seed: 3 promoções fictícias para teste
// Rodar no Mac: node seed-promocoes.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Busca a primeira imobiliária cadastrada
  const imobiliaria = await prisma.imobiliaria.findFirst();
  if (!imobiliaria) {
    console.error("Nenhuma imobiliária encontrada no banco.");
    process.exit(1);
  }

  console.log(`Criando promoções para: ${imobiliaria.nome} (${imobiliaria.id})`);

  const promocoes = [
    {
      imobiliariaId: imobiliaria.id,
      titulo: "Feirão de Imóveis — Julho 2026",
      subtitulo: "Condições especiais até o fim do mês!",
      descricao:
        "Aproveite descontos de até 15% em imóveis selecionados durante o nosso Feirão de Julho. Taxas de financiamento reduzidas e entrada facilitada para você realizar o sonho da casa própria.",
      imagemUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
      link: "/imoveis",
      ordem: 1,
      ativo: true,
      dataInicio: new Date("2026-07-01"),
      dataFim: new Date("2026-07-31"),
    },
    {
      imobiliariaId: imobiliaria.id,
      titulo: "Apartamentos com ITBI e escritura grátis",
      subtitulo: "Economia real na hora de fechar negócio",
      descricao:
        "Em unidades selecionadas do nosso portfólio, a imobiliária arca com o ITBI e os custos de escritura. Uma economia de milhares de reais direto no seu bolso. Consulte disponibilidade.",
      imagemUrl:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      link: "/imoveis",
      ordem: 2,
      ativo: true,
      dataInicio: null,
      dataFim: new Date("2026-09-30"),
    },
    {
      imobiliariaId: imobiliaria.id,
      titulo: "Primeira parcela só em 90 dias",
      subtitulo: "Mude agora, pague depois",
      descricao:
        "Feche contrato hoje e comece a pagar em 90 dias. Programa válido para imóveis residenciais financiados por bancos parceiros. Sujeito à aprovação de crédito.",
      imagemUrl:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
      link: "/imoveis",
      ordem: 3,
      ativo: true,
      dataInicio: null,
      dataFim: null,
    },
  ];

  for (const promo of promocoes) {
    const criada = await prisma.promocao.create({ data: promo });
    console.log(`✔ Criada: "${criada.titulo}" (${criada.id})`);
  }

  console.log("\nSeed concluído! Abra /promocoes no site para visualizar.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
