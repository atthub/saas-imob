// seed-fotos.js — adiciona 10 fotos a cada imóvel existente no banco
// Rode: DATABASE_URL="mysql://..." node seed-fotos.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Buscando imóveis...");

  const imoveis = await prisma.imovel.findMany({ select: { id: true, codigo: true, titulo: true } });
  console.log(`${imoveis.length} imóveis encontrados.\n`);

  for (const imovel of imoveis) {
    // Remove fotos existentes
    await prisma.foto.deleteMany({ where: { imovelId: imovel.id } });

    // Cria 10 fotos com seeds únicos por imóvel
    await prisma.foto.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        imovelId: imovel.id,
        url: `https://picsum.photos/seed/${imovel.id}-${i}/800/600`,
        ordem: i,
        capa: i === 0,
      })),
    });

    console.log(`✓ ${imovel.codigo} — ${imovel.titulo}`);
  }

  console.log("\n✅ Concluído! 10 fotos adicionadas a cada imóvel.");
}

main()
  .catch(e => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
