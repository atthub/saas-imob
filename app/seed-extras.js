// seed-extras.js — cadastra corretores, proprietários e leads fictícios
// Rode: DATABASE_URL="mysql://..." node seed-extras.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fone() { return `(${rand(11,99)}) 9${rand(1000,9999)}-${rand(1000,9999)}`; }

// ── Dados fictícios ───────────────────────────────────────────────────────────

const CORRETORES = [
  { nome: "Carlos Eduardo Martins",  email: "carlos.martins@homolog.com.br",   telefone: "(11) 98234-5610", creci: "12345-F" },
  { nome: "Fernanda Souza Lima",     email: "fernanda.lima@homolog.com.br",    telefone: "(11) 97654-3210", creci: "23456-F" },
  { nome: "Ricardo Alves Pereira",   email: "ricardo.pereira@homolog.com.br",  telefone: "(11) 96543-2109", creci: "34567-F" },
  { nome: "Juliana Costa Ribeiro",   email: "juliana.ribeiro@homolog.com.br",  telefone: "(11) 95432-1098", creci: "45678-F" },
  { nome: "Marcelo Henrique Nunes",  email: "marcelo.nunes@homolog.com.br",    telefone: "(19) 94321-0987", creci: "56789-F" },
  { nome: "Patrícia Oliveira Santos",email: "patricia.santos@homolog.com.br",  telefone: "(13) 93210-9876", creci: "67890-F" },
];

const PROPRIETARIOS = [
  { nome: "Roberto Figueiredo",    telefone: "(11) 98111-2233", email: "roberto.figueiredo@email.com",  obs: "Proprietário pontual, prefere contato por WhatsApp." },
  { nome: "Ana Paula Mendonça",    telefone: "(11) 97222-3344", email: "anapaula.mendonca@email.com",   obs: "Quer vender rápido, aceita proposta abaixo do valor." },
  { nome: "José Carlos Teixeira",  telefone: "(19) 96333-4455", email: "josecarlos.teixeira@email.com", obs: "Proprietário exigente, quer relatório mensal de visitas." },
  { nome: "Márcia Helena Borges",  telefone: "(13) 95444-5566", email: "marcia.borges@email.com",       obs: "Imóvel herdado. Documentação em regularização." },
  { nome: "Paulo Sérgio Monteiro", telefone: "(11) 94555-6677", email: "paulo.monteiro@email.com",      obs: "Investidor, tem outros imóveis na carteira." },
  { nome: "Cláudia Ramos Vieira",  telefone: "(16) 93666-7788", email: "claudia.vieira@email.com",      obs: "Mora fora do país, contato apenas por e-mail." },
  { nome: "Antônio Fernandes Cruz",telefone: "(11) 92777-8899", email: "antonio.cruz@email.com",        obs: "Prefere locação de longa duração." },
  { nome: "Luciana Prado Corrêa",  telefone: "(19) 91888-9900", email: "luciana.correa@email.com",      obs: "Imóvel em condomínio, taxa extra para documentação." },
];

const MENSAGENS_LEAD = [
  "Gostaria de agendar uma visita ao imóvel. Tenho disponibilidade nos finais de semana.",
  "Tenho interesse neste imóvel. Poderia me passar mais informações sobre a documentação?",
  "Vi o anúncio e fiquei muito interessado(a). Aceita proposta?",
  "Quero saber se o imóvel aceita financiamento pelo Minha Casa Minha Vida.",
  "Já estou com carta de crédito aprovada. Posso visitar ainda esta semana?",
  "Tenho interesse. O valor é negociável? Posso pagar à vista.",
  "Preciso de um imóvel com urgência para mudar no próximo mês. Este ainda está disponível?",
  "Gostaria de mais fotos e informações sobre a metragem do imóvel.",
  "Tenho interesse na locação. Qual o valor do IPTU e condomínio?",
  "Pode me informar se aceita animais de estimação?",
  "Estou comparando alguns imóveis na região. Quando posso visitar?",
  "Vi o imóvel pelo site e adorei. Como funciona o processo de compra?",
];

const NOMES_LEADS = [
  "Thiago Barbosa",       "Amanda Ferreira",     "Leandro Carvalho",
  "Gabriela Mendes",      "Felipe Rodrigues",    "Camila Nascimento",
  "Bruno Almeida",        "Larissa Gomes",       "Diego Castro",
  "Renata Pinto",         "Guilherme Sousa",     "Mariana Rezende",
  "Eduardo Lima",         "Isabela Torres",      "Rafael Cardoso",
  "Natália Freitas",      "Vinícius Araújo",     "Priscila Moreira",
  "Henrique Dias",        "Beatriz Cavalcanti",  "Lucas Rocha",
  "Vanessa Cunha",        "Murilo Santana",      "Aline Moura",
  "André Teixeira",       "Daniela Assis",       "Gustavo Barros",
  "Letícia Machado",      "Paulo Duarte",        "Sabrina Fonseca",
];

const CIDADES_LEADS = [
  "São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba",
  "Guarulhos", "Osasco", "São Bernardo do Campo", "Jundiaí",
];

const STATUS_LEAD = ["NOVO", "NOVO", "NOVO", "DIRECIONADO", "EM_ATENDIMENTO", "CONVERTIDO", "PERDIDO"];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Conectando ao banco...");

  const imobiliaria = await prisma.imobiliaria.findFirst();
  if (!imobiliaria) { console.error("Nenhuma imobiliária encontrada."); process.exit(1); }
  console.log(`Imobiliária: ${imobiliaria.nome}\n`);

  // ── Corretores ──────────────────────────────────────────────────────────────
  console.log("Criando corretores...");
  const corretoresCriados = [];
  for (const dados of CORRETORES) {
    const existente = await prisma.corretor.findFirst({
      where: { imobiliariaId: imobiliaria.id, email: dados.email },
    });
    if (existente) {
      console.log(`  Já existe: ${dados.nome}`);
      corretoresCriados.push(existente);
      continue;
    }
    const corretor = await prisma.corretor.create({
      data: {
        ...dados,
        whatsapp: dados.telefone.replace(/\D/g, ""),
        ativo: true,
        imobiliariaId: imobiliaria.id,
      },
    });
    corretoresCriados.push(corretor);
    console.log(`  ✓ ${corretor.nome} — CRECI ${corretor.creci}`);
  }

  // ── Proprietários + vínculo com imóveis ─────────────────────────────────────
  console.log("\nCriando proprietários...");
  const imoveis = await prisma.imovel.findMany({
    where: { imobiliariaId: imobiliaria.id },
    select: { id: true, codigo: true, titulo: true, proprietarioId: true },
    orderBy: { criadoEm: "asc" },
  });

  if (imoveis.length === 0) {
    console.log("Nenhum imóvel encontrado. Rode seed-demo.js e seed-demo2.js antes.");
    process.exit(1);
  }

  // Distribui os imóveis entre os proprietários (cada proprietário recebe 3-8 imóveis)
  const proprietariosCriados = [];
  let imovelIdx = 0;

  for (const dados of PROPRIETARIOS) {
    const existente = await prisma.proprietario.findFirst({
      where: { imobiliariaId: imobiliaria.id, telefone: dados.telefone },
    });

    const proprietario = existente ?? await prisma.proprietario.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email,
        observacoes: dados.obs,
        imobiliariaId: imobiliaria.id,
      },
    });

    if (!existente) {
      proprietariosCriados.push(proprietario);
    }

    // Vincula alguns imóveis a este proprietário
    const qtd = rand(3, 7);
    const imoveisDoProprietario = imoveis.slice(imovelIdx, imovelIdx + qtd);
    imovelIdx += qtd;

    for (const imovel of imoveisDoProprietario) {
      if (imovel.proprietarioId) continue; // já vinculado
      await prisma.imovel.update({
        where: { id: imovel.id },
        data: {
          proprietarioId: proprietario.id,
          proprietarioNome: proprietario.nome,
          proprietarioTelefone: proprietario.telefone,
          proprietarioEmail: proprietario.email ?? undefined,
        },
      });
    }

    console.log(`  ✓ ${proprietario.nome} → ${imoveisDoProprietario.length} imóvel(is) vinculado(s)`);

    if (imovelIdx >= imoveis.length) break;
  }

  // ── Leads ───────────────────────────────────────────────────────────────────
  console.log("\nCriando leads...");

  // Pega imóveis disponíveis para receber leads
  const imoveisParaLead = imoveis.slice(0, Math.min(25, imoveis.length));
  const totalLeads = 40;

  for (let i = 0; i < totalLeads; i++) {
    const nome      = pick(NOMES_LEADS);
    const imovel    = pick(imoveisParaLead);
    const corretor  = rand(0, 3) > 0 ? pick(corretoresCriados) : null; // 75% com corretor
    const status    = pick(STATUS_LEAD);

    await prisma.lead.create({
      data: {
        nome,
        telefone: fone(),
        cidade: pick(CIDADES_LEADS),
        mensagem: pick(MENSAGENS_LEAD),
        imovelId: imovel.id,
        imobiliariaId: imobiliaria.id,
        corretorId: corretor?.id ?? null,
        status,
        origem: pick(["site", "site", "site", "manual", "captacao"]),
        direcionadoEm: ["DIRECIONADO","EM_ATENDIMENTO","CONVERTIDO","PERDIDO"].includes(status)
          ? new Date(Date.now() - rand(1, 30) * 86400000)
          : null,
      },
    });

    process.stdout.write(`  ✓ Lead ${i + 1}/${totalLeads} — ${nome}\r`);
  }

  console.log(`\n  ✓ ${totalLeads} leads criados.`);
  console.log("\n✅ Concluído! Corretores, proprietários e leads inseridos com sucesso.");
}

main()
  .catch(e => { console.error("\nErro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
