// reset-super-admin.js
// Executa no servidor cPanel para resetar a senha do SUPER_ADMIN
// Uso: node reset-super-admin.js
//
// ATENÇÃO: apague este arquivo do servidor após usar.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// ── ALTERE AQUI ──────────────────────────────────────────────────────────────
const NOVA_SENHA = "Admin@2026!"; // troque para a senha que desejar
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.usuario.findMany({
    where: { papel: "SUPER_ADMIN" },
    select: { id: true, nome: true, email: true }
  });

  if (admins.length === 0) {
    console.log("Nenhum usuario SUPER_ADMIN encontrado no banco.");
    return;
  }

  console.log(`SUPER_ADMIN(s) encontrado(s):`);
  for (const admin of admins) {
    console.log(`  - ${admin.nome} <${admin.email}>`);
  }

  const hash = await bcrypt.hash(NOVA_SENHA, 10);

  for (const admin of admins) {
    await prisma.usuario.update({
      where: { id: admin.id },
      data: { senhaHash: hash }
    });
    console.log(`Senha resetada para: ${admin.email}`);
  }

  console.log(`\nNova senha: ${NOVA_SENHA}`);
  console.log("Acesse o painel e troque para uma senha definitiva em: Minha Conta > Alterar Senha");
  console.log("\nLEMBRE-SE: apague este arquivo do servidor agora!");
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
