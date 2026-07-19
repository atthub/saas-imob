// seed-demo.js — popula o banco de homologação com imóveis fictícios
// Rode localmente: node seed-demo.js
// Requer: DATABASE_URL apontando para o banco remoto (no .env do projeto)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function foto(seed) {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Dados fictícios ───────────────────────────────────────────────────────────

const CIDADES = [
  { nome: "São Paulo", uf: "SP", bairros: ["Moema", "Pinheiros", "Vila Mariana", "Perdizes", "Santana"] },
  { nome: "Campinas", uf: "SP", bairros: ["Cambuí", "Taquaral", "Nova Campinas", "Jardim Proença"] },
  { nome: "Santos",   uf: "SP", bairros: ["Gonzaga", "Boqueirão", "Aparecida", "José Menino"] },
];

const CARACTERISTICAS = [
  "Suíte", "Closet", "Piscina", "Churrasqueira", "Quintal",
  "Varanda", "Área de Serviço", "Garagem Coberta", "Ar Condicionado",
  "Mobiliado", "Aceita Pet", "Energia Solar",
];

const CARACTERISTICAS_COND = [
  "Portaria 24h", "Salão de Festas", "Academia", "Piscina do Condomínio",
  "Playground", "Quadra Poliesportiva", "Elevador", "Portão Eletrônico",
];

const DESCRICOES = [
  "Imóvel em ótima localização, próximo a comércio e transporte público. Acabamento de qualidade e espaços amplos.",
  "Excelente oportunidade! Imóvel bem conservado, em rua tranquila e arborizada. Ideal para famílias.",
  "Ótimo imóvel com luz natural em todos os cômodos. Cozinha planejada e banheiros reformados.",
  "Amplo e arejado, com uma vista privilegiada. Condomínio seguro com portaria 24 horas.",
  "Localizado em uma das melhores ruas do bairro, com fácil acesso às principais vias.",
  "Imóvel todo reformado, pronto para morar. Acabamento moderno e área de lazer completa.",
  "Ótima planta, sem área de serviço descoberta. Dois andares com espaço inteligente aproveitado.",
  "Imóvel com excelente custo-benefício. Próximo a escolas, supermercados e parques.",
];

// Gera os imóveis fictícios
function gerarImoveis(imobiliariaId, cidadesMap, caractMap, caractCondMap) {
  const imoveis = [];
  let codigo = 1001;

  // Casas à venda
  for (let i = 0; i < 6; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    const quartos = rand(2, 5);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Casa ${quartos} quartos — ${bairro}`,
      descricao: pick(DESCRICOES),
      tipo: "CASA",
      finalidade: "VENDA",
      status: "DISPONIVEL",
      valorVenda: rand(280, 950) * 1000,
      areaTotal: rand(80, 350),
      areaConstruida: rand(60, 280),
      quartos,
      suites: rand(1, quartos),
      banheiros: rand(1, 3),
      vagasGaragem: rand(1, 3),
      destaque: i < 2,
      endereco: `Rua das Flores, ${rand(10, 999)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: [pick(CARACTERISTICAS), pick(CARACTERISTICAS), pick(CARACTERISTICAS)],
      caractCond: [],
      fotos: [foto(`casa-${i}-1`), foto(`casa-${i}-2`), foto(`casa-${i}-3`)],
    });
  }

  // Casas para locação
  for (let i = 0; i < 4; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    const quartos = rand(2, 4);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Casa para alugar ${quartos} quartos — ${bairro}`,
      descricao: pick(DESCRICOES),
      tipo: "CASA",
      finalidade: "LOCACAO",
      status: "DISPONIVEL",
      valorLocacao: rand(1800, 5500),
      valorCondominio: rand(200, 600),
      areaTotal: rand(70, 200),
      areaConstruida: rand(60, 180),
      quartos,
      suites: rand(0, 2),
      banheiros: rand(1, 3),
      vagasGaragem: rand(1, 2),
      destaque: false,
      endereco: `Alameda dos Ipês, ${rand(10, 500)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: [pick(CARACTERISTICAS), pick(CARACTERISTICAS)],
      caractCond: [],
      fotos: [foto(`casaloc-${i}-1`), foto(`casaloc-${i}-2`)],
    });
  }

  // Apartamentos à venda
  for (let i = 0; i < 6; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    const quartos = rand(1, 4);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Apartamento ${quartos} dorm. — ${bairro}`,
      descricao: pick(DESCRICOES),
      tipo: "APARTAMENTO",
      finalidade: "VENDA",
      status: "DISPONIVEL",
      valorVenda: rand(220, 750) * 1000,
      valorCondominio: rand(300, 900),
      valorIptu: rand(80, 300),
      areaTotal: rand(45, 180),
      areaConstruida: rand(45, 180),
      quartos,
      suites: rand(0, quartos),
      banheiros: rand(1, 3),
      vagasGaragem: rand(1, 2),
      destaque: i < 2,
      endereco: `Avenida Brasil, ${rand(100, 2000)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: [pick(CARACTERISTICAS), pick(CARACTERISTICAS)],
      caractCond: [pick(CARACTERISTICAS_COND), pick(CARACTERISTICAS_COND)],
      fotos: [foto(`apto-${i}-1`), foto(`apto-${i}-2`), foto(`apto-${i}-3`)],
    });
  }

  // Apartamentos para locação
  for (let i = 0; i < 5; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    const quartos = rand(1, 3);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Apartamento para alugar ${quartos} dorm. — ${bairro}`,
      descricao: pick(DESCRICOES),
      tipo: "APARTAMENTO",
      finalidade: "LOCACAO",
      status: "DISPONIVEL",
      valorLocacao: rand(1200, 4000),
      valorCondominio: rand(250, 700),
      areaTotal: rand(40, 120),
      areaConstruida: rand(40, 120),
      quartos,
      suites: rand(0, 1),
      banheiros: rand(1, 2),
      vagasGaragem: rand(0, 1),
      destaque: false,
      endereco: `Rua Augusta, ${rand(100, 1000)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: [pick(CARACTERISTICAS)],
      caractCond: [pick(CARACTERISTICAS_COND)],
      fotos: [foto(`aptoloc-${i}-1`), foto(`aptoloc-${i}-2`)],
    });
  }

  // Terrenos
  for (let i = 0; i < 3; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Terreno ${rand(200, 1000)}m² — ${bairro}`,
      descricao: "Excelente terreno em localização privilegiada, com toda infraestrutura de serviços públicos disponível.",
      tipo: "TERRENO",
      finalidade: "VENDA",
      status: "DISPONIVEL",
      valorVenda: rand(80, 400) * 1000,
      areaTotal: rand(200, 1000),
      destaque: false,
      endereco: `Estrada Municipal, ${rand(1, 200)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: [],
      caractCond: [],
      fotos: [foto(`terreno-${i}-1`)],
    });
  }

  // Kitnets
  for (let i = 0; i < 3; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Kitnet mobiliada — ${bairro}`,
      descricao: "Kitnet bem localizada, próxima a universidades e transporte público. Ideal para estudantes.",
      tipo: "KITNET",
      finalidade: "LOCACAO",
      status: "DISPONIVEL",
      valorLocacao: rand(700, 1400),
      areaTotal: rand(18, 35),
      areaConstruida: rand(18, 35),
      quartos: 1,
      banheiros: 1,
      vagasGaragem: 0,
      destaque: false,
      endereco: `Rua do Comércio, ${rand(10, 500)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: ["Mobiliado"],
      caractCond: [],
      fotos: [foto(`kitnet-${i}-1`)],
    });
  }

  // Salas comerciais
  for (let i = 0; i < 3; i++) {
    const cidade = pick(CIDADES);
    const bairro = pick(cidade.bairros);
    imoveis.push({
      imobiliariaId,
      codigo: String(codigo++),
      titulo: `Sala comercial ${rand(30, 120)}m² — ${bairro}`,
      descricao: "Sala em edifício comercial moderno, com recepção, estacionamento e segurança 24h.",
      tipo: "SALA_COMERCIAL",
      finalidade: pick(["VENDA", "LOCACAO"]),
      status: "DISPONIVEL",
      valorVenda: rand(150, 600) * 1000,
      valorLocacao: rand(1500, 5000),
      areaTotal: rand(30, 120),
      areaConstruida: rand(30, 120),
      vagasGaragem: rand(1, 3),
      destaque: false,
      endereco: `Avenida Paulista, ${rand(100, 2000)}`,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
      bairroNome: bairro,
      caract: ["Ar Condicionado"],
      caractCond: ["Portaria 24h", "Elevador"],
      fotos: [foto(`sala-${i}-1`), foto(`sala-${i}-2`)],
    });
  }

  return imoveis;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Conectando ao banco...");

  // Busca a imobiliária existente
  const imobiliaria = await prisma.imobiliaria.findFirst();
  if (!imobiliaria) {
    console.error("Nenhuma imobiliária encontrada. Execute o wizard primeiro.");
    process.exit(1);
  }
  console.log(`Imobiliária: ${imobiliaria.nome} (${imobiliaria.id})`);

  // Cria cidades e bairros
  console.log("Criando cidades e bairros...");
  const cidadesMap = {};
  const bairrosMap = {};

  for (const c of CIDADES) {
    const cidade = await prisma.cidade.upsert({
      where: { nome_uf: { nome: c.nome, uf: c.uf } },
      update: {},
      create: { nome: c.nome, uf: c.uf },
    });
    cidadesMap[`${c.nome}-${c.uf}`] = cidade;

    for (const b of c.bairros) {
      const bairro = await prisma.bairro.upsert({
        where: { nome_cidadeId: { nome: b, cidadeId: cidade.id } },
        update: {},
        create: { nome: b, cidadeId: cidade.id },
      });
      bairrosMap[`${b}-${cidade.id}`] = bairro;
    }
  }

  // Cria características
  console.log("Criando características...");
  const caractMap = {};
  for (const nome of CARACTERISTICAS) {
    const c = await prisma.caracteristica.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
    caractMap[nome] = c;
  }

  const caractCondMap = {};
  for (const nome of CARACTERISTICAS_COND) {
    const c = await prisma.caracteristicaCondominio.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
    caractCondMap[nome] = c;
  }

  // Gera e insere imóveis
  const imoveis = gerarImoveis(imobiliaria.id, cidadesMap, caractMap, caractCondMap);
  console.log(`Criando ${imoveis.length} imóveis...`);

  for (const dados of imoveis) {
    const { cidadeNome, cidadeUf, bairroNome, caract, caractCond, fotos, ...imovelData } = dados;

    const cidadeObj = cidadesMap[`${cidadeNome}-${cidadeUf}`];
    const bairroObj = bairrosMap[`${bairroNome}-${cidadeObj.id}`];

    // Evita duplicar pelo código
    const existente = await prisma.imovel.findUnique({
      where: { imobiliariaId_codigo: { imobiliariaId: imobiliaria.id, codigo: imovelData.codigo } },
    });
    if (existente) {
      console.log(`  Pulando ${imovelData.codigo} (já existe)`);
      continue;
    }

    const imovel = await prisma.imovel.create({
      data: {
        ...imovelData,
        cidadeId: cidadeObj?.id,
        bairroId: bairroObj?.id,
        fotos: {
          create: fotos.map((url, idx) => ({
            url,
            ordem: idx,
            capa: idx === 0,
          })),
        },
        caracteristicas: caract.length > 0 ? {
          create: [...new Set(caract)]
            .filter(n => caractMap[n])
            .map(n => ({ caracteristicaId: caractMap[n].id })),
        } : undefined,
        condominioCaracteristicas: caractCond.length > 0 ? {
          create: [...new Set(caractCond)]
            .filter(n => caractCondMap[n])
            .map(n => ({ caracteristicaId: caractCondMap[n].id })),
        } : undefined,
      },
    });

    console.log(`  ✓ ${imovel.codigo} — ${imovel.titulo}`);
  }

  console.log("\n✅ Concluído! Imóveis criados com sucesso.");
}

main()
  .catch(e => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
