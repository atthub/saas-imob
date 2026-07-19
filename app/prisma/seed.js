// Versão em JavaScript puro do seed (sem TypeScript), para poder ser executada
// diretamente pelo Node no servidor — inclusive automaticamente pelo server.js
// a cada inicialização do app (operações idempotentes via upsert).
//
// IMPORTANTE: o seed só roda para a instalação Delta Imóveis Pinda.
// Em deploys de outros clientes (DEFAULT_TENANT_SLUG diferente), o seed é ignorado —
// o wizard de instalação cuida da criação dos dados iniciais.

const DELTA_SLUG = "delta-imoveis-pinda";
const tenantAtual = process.env.DEFAULT_TENANT_SLUG || "";

if (tenantAtual !== DELTA_SLUG) {
  console.log(`Seed ignorado: instalação '${tenantAtual || "(vazia)"}' não é Delta. Dados configurados via wizard.`);
  process.exit(0);
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const imobiliaria = await prisma.imobiliaria.upsert({
    where: { slug: "delta-imoveis-pinda" },
    update: {},
    create: {
      nome: "Delta Imóveis Pinda",
      slug: "delta-imoveis-pinda",
      creci: "25.006",
      descricao:
        "Empresa que atua no ramo imobiliário há mais de 10 anos no distrito de Moreira César, Pindamonhangaba e região.",
      telefone: "(12) 3525-2000",
      whatsapp: "5512996450389",
      email: "elianagodoy@deltaimoveispinda.com.br",
      endereco: "Rod. Vereador Abel Fabricio Dias, n° 1473, Bairro Vila São Benedito, Pindamonhangaba/SP",
      cidadePrincipal: "Pindamonhangaba",
      estadoPrincipal: "SP",
      corPrimaria: "#0D0D0D",
      corSecundaria: "#C5A059",
      corDestaque: "#DD8500",
      corFundo: "#F5F7FA",
      fontHeading: "Oxygen",
      fontBody: "Inter"
    }
  });

  await prisma.redeSocial.deleteMany({ where: { imobiliariaId: imobiliaria.id } });
  await prisma.redeSocial.createMany({
    data: [
      { imobiliariaId: imobiliaria.id, plataforma: "facebook", url: "https://www.facebook.com/deltaimoveis.pinda", ordem: 0 },
      { imobiliariaId: imobiliaria.id, plataforma: "instagram", url: "https://www.instagram.com/deltaimoveis.pinda/", ordem: 1 },
      { imobiliariaId: imobiliaria.id, plataforma: "tiktok", url: "https://www.tiktok.com/@deltaimoveispinda", ordem: 2 },
      { imobiliariaId: imobiliaria.id, plataforma: "whatsapp", url: "https://wa.me/5512996450389", ordem: 3 }
    ]
  });

  const senhaHash = await bcrypt.hash("delta2026", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@deltaimoveispinda.com.br" },
    update: {},
    create: {
      nome: "Eliana Godoy",
      email: "admin@deltaimoveispinda.com.br",
      senhaHash,
      papel: "ADMIN",
      imobiliariaId: imobiliaria.id
    }
  });

  const cidade = await prisma.cidade.upsert({
    where: { nome_uf: { nome: "Pindamonhangaba", uf: "SP" } },
    update: {},
    create: { nome: "Pindamonhangaba", uf: "SP" }
  });

  await prisma.bairro.upsert({
    where: { nome_cidadeId: { nome: "Vila São Benedito", cidadeId: cidade.id } },
    update: {},
    create: { nome: "Vila São Benedito", cidadeId: cidade.id }
  });

  await prisma.bairro.upsert({
    where: { nome_cidadeId: { nome: "Moreira César", cidadeId: cidade.id } },
    update: {},
    create: { nome: "Moreira César", cidadeId: cidade.id }
  });

  // Banner de exemplo no slider da hero, só criado se a imobiliária ainda
  // não tiver nenhum banner cadastrado (não sobrescreve o que o usuário subir
  // pela tela de admin).
  const totalBanners = await prisma.banner.count({ where: { imobiliariaId: imobiliaria.id } });
  if (totalBanners === 0) {
    await prisma.banner.create({
      data: {
        imobiliariaId: imobiliaria.id,
        titulo: "Delta Imóveis Pinda",
        urlDesktop: "/uploads/banners-exemplo/banner-exemplo-1.jpg",
        link: "/imoveis",
        ordem: 0,
        ativo: true
      }
    });
  }

  const caracteristicas = [
    "Suíte", "Closet", "Piscina", "Churrasqueira", "Quintal", "Varanda",
    "Área de Serviço", "Garagem Coberta", "Ar Condicionado", "Mobiliado",
    "Aceita Pet", "Energia Solar"
  ];
  for (const nome of caracteristicas) {
    await prisma.caracteristica.upsert({ where: { nome }, update: {}, create: { nome } });
  }

  const caracteristicasCondominio = [
    "Portaria 24h", "Salão de Festas", "Academia", "Piscina do Condomínio",
    "Playground", "Quadra Poliesportiva", "Elevador", "Portão Eletrônico"
  ];
  for (const nome of caracteristicasCondominio) {
    await prisma.caracteristicaCondominio.upsert({ where: { nome }, update: {}, create: { nome } });
  }

  console.log("Seed concluído. Login: admin@deltaimoveispinda.com.br / senha: delta2026");
}

main()
  .catch((e) => {
    console.error("Erro ao rodar o seed:", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
