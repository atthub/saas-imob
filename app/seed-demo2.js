// seed-demo2.js — adiciona 30 imóveis com 10 fotos cada
// Rode: DATABASE_URL="mysql://..." node seed-demo2.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const CIDADES = [
  { nome: "São Paulo",      uf: "SP", bairros: ["Moema", "Pinheiros", "Vila Mariana", "Perdizes", "Santana", "Tatuapé", "Lapa"] },
  { nome: "Campinas",       uf: "SP", bairros: ["Cambuí", "Taquaral", "Nova Campinas", "Jardim Proença", "Barão Geraldo"] },
  { nome: "Santos",         uf: "SP", bairros: ["Gonzaga", "Boqueirão", "Aparecida", "José Menino", "Pompéia"] },
  { nome: "Ribeirão Preto", uf: "SP", bairros: ["Jardim Sumaré", "Nova Aliança", "Alto da Boa Vista", "Centro"] },
  { nome: "Sorocaba",       uf: "SP", bairros: ["Além Ponte", "Jardim Vera Cruz", "Centro", "Wanel Ville"] },
];

const FINALIDADES = ["VENDA", "LOCACAO", "VENDA_E_LOCACAO"];

const TIPOS = [
  { tipo: "CASA",          peso: 8 },
  { tipo: "APARTAMENTO",   peso: 8 },
  { tipo: "TERRENO",       peso: 3 },
  { tipo: "KITNET",        peso: 3 },
  { tipo: "SALA_COMERCIAL",peso: 3 },
  { tipo: "CHACARA",       peso: 3 },
  { tipo: "GALPAO",        peso: 2 },
];

const CARACTERISTICAS = [
  "Suíte","Closet","Piscina","Churrasqueira","Quintal","Varanda",
  "Área de Serviço","Garagem Coberta","Ar Condicionado","Mobiliado",
  "Aceita Pet","Energia Solar",
];

const CARACTERISTICAS_COND = [
  "Portaria 24h","Salão de Festas","Academia","Piscina do Condomínio",
  "Playground","Quadra Poliesportiva","Elevador","Portão Eletrônico",
];

const DESCRICOES = {
  CASA: [
    `Excelente casa em rua tranquila e arborizada, com acabamento de alto padrão. A propriedade conta com sala de estar integrada à sala de jantar, cozinha americana com bancada em granito e armários planejados. Os quartos são espaçosos, todos com armários embutidos. O quintal amplo possui área gourmet com churrasqueira e espaço para piscina. Garagem coberta para dois veículos. Localização privilegiada, próxima a escolas, supermercados e transporte público. Não perca esta oportunidade!`,
    `Linda residência em condomínio fechado de alto padrão, com infraestrutura completa de lazer. A casa possui pé-direito duplo na sala, cozinha gourmet totalmente equipada, lavabo social e escritório. Suíte master com closet e banheiro com banheira de hidromassagem. Jardim paisagístico projetado por arquiteto. Sistema de energia solar instalado reduz significativamente as contas de luz. Segurança 24 horas no condomínio.`,
    `Casa térrea muito bem conservada, reformada há 2 anos, com novos pisos porcelanato, pintura, instalações elétricas e hidráulicas. Sala ampla com piso aquecido, cozinha com ilha central. Três quartos sendo uma suíte. Lavanderia coberta. Quintal com pomar e espaço para horta. Vizinhança tranquila e familiar. Fácil acesso à rodovia e ao centro da cidade.`,
  ],
  APARTAMENTO: [
    `Amplo apartamento em andar alto com vista panorâmica para o parque. Três dormitórios sendo uma suíte, sala em dois ambientes com sacada gourmet, cozinha planejada com cooktop e forno de embutir. O condomínio oferece infraestrutura completa: academia equipada, piscina aquecida, salão de festas, brinquedoteca e segurança com câmeras 24 horas. Duas vagas de garagem cobertas. Prédio com certificação verde.`,
    `Apartamento moderno no coração do bairro, a poucos metros do metrô e dos principais comércios. Planta inteligente com ambientes integrados e muito aproveitamento de espaço. Cozinha americana com ilha de granito. Dois banheiros completamente reformados com porcelanato importado. Varanda com churrasqueira a gás. Condomínio com portaria 24h, academia e pet place.`,
    `Cobertura duplex com terraço privativo de 80m². Três suítes, sala com pé-direito duplo, cozinha gourmet integrada ao terraço com piscina privativa e área de churrasco. Vista deslumbrante para a cidade. Dois elevadores privativos. Quatro vagas de garagem. Acabamento sofisticado com mármore travertino, janelas de alumínio com vidro temperado e automação residencial completa.`,
  ],
  TERRENO: [
    `Terreno plano em localização estratégica, com toda infraestrutura de serviços públicos disponível: água encanada, esgoto, energia elétrica, calçamento e iluminação pública. Documentação regularizada e pronta para construção imediata. Próximo a escolas, comércio e fácil acesso às vias principais. Excelente oportunidade para construção residencial ou comercial.`,
    `Lote em condomínio fechado de alto padrão, com segurança 24 horas, ruas asfaltadas e paisagismo impecável. Topografia plana, frente de 12 metros por 30 de fundo. Permite construção de sobrado ou casa térrea. Infraestrutura completa já implantada. Área de lazer do condomínio com clube, piscinas, quadras e área verde preservada.`,
  ],
  KITNET: [
    `Kitnet totalmente mobiliada e equipada, ideal para estudantes e profissionais que buscam praticidade. Localizada a 500 metros da universidade e próxima ao terminal de ônibus. O imóvel conta com cama box, guarda-roupa, mesa de escritório, frigobar e micro-ondas inclusos. Banheiro reformado e varanda privativa. Condomínio com lavanderia compartilhada e internet fibra ótica incluída no aluguel.`,
  ],
  SALA_COMERCIAL: [
    `Sala comercial em edifício triple A, localizada em avenida de grande fluxo comercial. Piso elevado técnico, teto com forração acústica, ar condicionado central incluso. Banheiros privativos, copa e recepção compartilhada no andar. Edifício com lobby modernizado, segurança 24 horas, três elevadores e estacionamento para visitantes. Ideal para escritórios, consultórios ou sedes corporativas.`,
    `Conjunto comercial em andar alto com vista para a cidade. Dois ambientes integrados com possibilidade de divisão. Recepção ampla, sala de reuniões, dois banheiros e copa. O edifício conta com gerador próprio, internet de alta velocidade no condôminio, manobrista e estacionamento rotativo. Certificado com AVCB em dia. Excelente visibilidade e localização para a sua empresa.`,
  ],
  CHACARA: [
    `Chácara com área total de ${rand(2000, 8000)}m² em região de acesso asfaltado, a apenas 20km do centro. Conta com casa sede de 180m², piscina, lago artificial para pesca, pomar com diversas frutíferas, curral e galpão para equipamentos. Nascente de água própria com poço artesiano. Cercada e com portão eletrônico. Ideal para lazer de final de semana ou moradia permanente no campo.`,
  ],
  GALPAO: [
    `Galpão industrial com pé-direito de 8 metros, piso de concreto reforçado (carga de 5t/m²), duas docas para caminhões, refeitório, vestiários e escritório de 60m² integrado. Instalações elétricas trifásicas 440V, sistema de iluminação LED de alta eficiência. Área de manobra ampla no pátio externo. Localizado em zona industrial com acesso direto à rodovia. AVCB e laudos em dia.`,
  ],
};

function getDescricao(tipo) {
  const opcoes = DESCRICOES[tipo] || DESCRICOES["CASA"];
  return pick(opcoes);
}

function sortearTipo() {
  const pool = [];
  for (const t of TIPOS) for (let i = 0; i < t.peso; i++) pool.push(t.tipo);
  return pick(pool);
}

function gerarValores(tipo, finalidade) {
  const vals = {};
  if (finalidade === "VENDA" || finalidade === "VENDA_E_LOCACAO") {
    const precos = {
      CASA: rand(350, 1200) * 1000,
      APARTAMENTO: rand(280, 900) * 1000,
      TERRENO: rand(120, 500) * 1000,
      KITNET: rand(130, 280) * 1000,
      SALA_COMERCIAL: rand(200, 800) * 1000,
      CHACARA: rand(500, 2000) * 1000,
      GALPAO: rand(800, 3000) * 1000,
    };
    vals.valorVenda = precos[tipo] || rand(200, 600) * 1000;
  }
  if (finalidade === "LOCACAO" || finalidade === "VENDA_E_LOCACAO") {
    const alugueis = {
      CASA: rand(2000, 6000),
      APARTAMENTO: rand(1500, 5000),
      TERRENO: rand(800, 2000),
      KITNET: rand(700, 1400),
      SALA_COMERCIAL: rand(2000, 8000),
      CHACARA: rand(3000, 10000),
      GALPAO: rand(5000, 20000),
    };
    vals.valorLocacao = alugueis[tipo] || rand(1500, 4000);
    if (["APARTAMENTO", "SALA_COMERCIAL", "GALPAO"].includes(tipo)) {
      vals.valorCondominio = rand(300, 1200);
    }
  }
  if (["CASA", "APARTAMENTO", "KITNET"].includes(tipo)) {
    vals.valorIptu = rand(50, 400);
  }
  return vals;
}

function gerarAreas(tipo) {
  const areas = {
    CASA:           { total: rand(80, 400),   construida: rand(70, 350) },
    APARTAMENTO:    { total: rand(40, 200),   construida: rand(40, 200) },
    TERRENO:        { total: rand(200, 2000), construida: null },
    KITNET:         { total: rand(18, 40),    construida: rand(18, 40) },
    SALA_COMERCIAL: { total: rand(30, 200),   construida: rand(30, 200) },
    CHACARA:        { total: rand(2000, 10000), construida: rand(100, 300) },
    GALPAO:         { total: rand(300, 3000), construida: rand(300, 3000) },
  };
  return areas[tipo] || { total: rand(80, 300), construida: rand(60, 250) };
}

function gerarComodos(tipo) {
  if (["TERRENO", "GALPAO"].includes(tipo)) return {};
  if (tipo === "KITNET") return { quartos: 1, suites: 0, banheiros: 1, vagasGaragem: 0 };
  if (tipo === "SALA_COMERCIAL") return { vagasGaragem: rand(1, 4) };
  if (tipo === "CHACARA") return { quartos: rand(3, 6), suites: rand(1, 3), banheiros: rand(2, 4), vagasGaragem: rand(2, 6) };
  const quartos = rand(1, 5);
  return {
    quartos,
    suites: rand(0, quartos),
    banheiros: rand(1, 4),
    vagasGaragem: rand(0, 3),
  };
}

const ENDERECOS = [
  "Rua das Acácias", "Avenida Brasil", "Rua do Ipê", "Alameda dos Flamboyants",
  "Rua XV de Novembro", "Avenida Paulista", "Rua Cel. Joaquim", "Travessa das Orquídeas",
  "Rua Barão do Rio Branco", "Avenida São João", "Rua Tiradentes", "Alameda Santos",
];

async function main() {
  console.log("Conectando ao banco...");

  const imobiliaria = await prisma.imobiliaria.findFirst();
  if (!imobiliaria) { console.error("Nenhuma imobiliária encontrada."); process.exit(1); }
  console.log(`Imobiliária: ${imobiliaria.nome}\n`);

  // Garante cidades e bairros
  const cidadesMap = {};
  const bairrosMap = {};
  for (const c of CIDADES) {
    const cidade = await prisma.cidade.upsert({
      where: { nome_uf: { nome: c.nome, uf: c.uf } },
      update: {}, create: { nome: c.nome, uf: c.uf },
    });
    cidadesMap[`${c.nome}-${c.uf}`] = cidade;
    for (const b of c.bairros) {
      const bairro = await prisma.bairro.upsert({
        where: { nome_cidadeId: { nome: b, cidadeId: cidade.id } },
        update: {}, create: { nome: b, cidadeId: cidade.id },
      });
      bairrosMap[`${b}-${cidade.id}`] = bairro;
    }
  }

  // Garante características
  const caractMap = {};
  for (const nome of CARACTERISTICAS) {
    const c = await prisma.caracteristica.upsert({ where: { nome }, update: {}, create: { nome } });
    caractMap[nome] = c;
  }
  const caractCondMap = {};
  for (const nome of CARACTERISTICAS_COND) {
    const c = await prisma.caracteristicaCondominio.upsert({ where: { nome }, update: {}, create: { nome } });
    caractCondMap[nome] = c;
  }

  // Próximo código disponível
  const ultimo = await prisma.imovel.findFirst({
    where: { imobiliariaId: imobiliaria.id },
    orderBy: { criadoEm: "desc" },
  });
  let proximoCodigo = 2001;
  if (ultimo) {
    const n = parseInt(ultimo.codigo);
    if (!isNaN(n)) proximoCodigo = Math.max(proximoCodigo, n + 1);
  }

  console.log(`Criando 30 imóveis a partir do código ${proximoCodigo}...\n`);

  for (let i = 0; i < 30; i++) {
    const tipo       = sortearTipo();
    const finalidade = pick(FINALIDADES);
    const cidade     = pick(CIDADES);
    const bairro     = pick(cidade.bairros);
    const cidadeObj  = cidadesMap[`${cidade.nome}-${cidade.uf}`];
    const bairroObj  = bairrosMap[`${bairro}-${cidadeObj.id}`];
    const codigo     = String(proximoCodigo++);
    const areas      = gerarAreas(tipo);
    const comodos    = gerarComodos(tipo);
    const valores    = gerarValores(tipo, finalidade);
    const descricao  = getDescricao(tipo);

    // Título
    const titulos = {
      CASA:           `Casa ${comodos.quartos ? comodos.quartos + " quartos" : ""} — ${bairro}, ${cidade.nome}`,
      APARTAMENTO:    `Apartamento ${comodos.quartos ? comodos.quartos + " dorm." : ""} — ${bairro}`,
      TERRENO:        `Terreno ${areas.total}m² — ${bairro}, ${cidade.nome}`,
      KITNET:         `Kitnet mobiliada — ${bairro}, ${cidade.nome}`,
      SALA_COMERCIAL: `Sala comercial ${areas.total}m² — ${bairro}`,
      CHACARA:        `Chácara com ${areas.total}m² — ${cidade.nome}`,
      GALPAO:         `Galpão industrial ${areas.total}m² — ${cidade.nome}`,
    };

    // Características aleatórias
    const qtdCaract = rand(2, 5);
    const caractSelecionadas = [...CARACTERISTICAS].sort(() => 0.5 - Math.random()).slice(0, qtdCaract);
    const qtdCondCaract = ["APARTAMENTO", "SALA_COMERCIAL"].includes(tipo) ? rand(2, 4) : 0;
    const caractCondSelecionadas = [...CARACTERISTICAS_COND].sort(() => 0.5 - Math.random()).slice(0, qtdCondCaract);

    const imovel = await prisma.imovel.create({
      data: {
        imobiliariaId: imobiliaria.id,
        codigo,
        titulo: titulos[tipo] || `Imóvel ${codigo}`,
        descricao,
        tipo,
        finalidade,
        status: "DISPONIVEL",
        ...valores,
        areaTotal: areas.total,
        areaConstruida: areas.construida ?? undefined,
        ...comodos,
        endereco: `${pick(ENDERECOS)}, ${rand(10, 999)}`,
        cidadeId: cidadeObj?.id,
        bairroId: bairroObj?.id,
        destaque: i < 4,
        fotos: {
          create: Array.from({ length: 10 }, (_, idx) => ({
            url: `https://picsum.photos/seed/demo2-${codigo}-${idx}/800/600`,
            ordem: idx,
            capa: idx === 0,
          })),
        },
        caracteristicas: caractSelecionadas.length > 0 ? {
          create: caractSelecionadas.filter(n => caractMap[n]).map(n => ({ caracteristicaId: caractMap[n].id })),
        } : undefined,
        condominioCaracteristicas: caractCondSelecionadas.length > 0 ? {
          create: caractCondSelecionadas.filter(n => caractCondMap[n]).map(n => ({ caracteristicaId: caractCondMap[n].id })),
        } : undefined,
      },
    });

    const label = { VENDA: "Venda", LOCACAO: "Aluguel", VENDA_E_LOCACAO: "Venda+Locação" }[finalidade];
    console.log(`✓ ${imovel.codigo} [${tipo}] [${label}] — ${imovel.titulo}`);
  }

  console.log("\n✅ 30 imóveis criados com 10 fotos cada!");
}

main()
  .catch(e => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
