import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas instâncias do PrismaClient em hot-reload (dev)
// e mantém uma única conexão reaproveitada em produção (cPanel/Node).
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  schemaInited: boolean;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

// Garante colunas de toggle na primeira inicialização do processo.
// Usa ADD COLUMN IF NOT EXISTS — seguro rodar múltiplas vezes.
// Funciona com Phusion Passenger, next start ou qualquer runtime Node.js.
if (!globalForPrisma.schemaInited) {
  globalForPrisma.schemaInited = true;
  globalForPrisma.prisma = prisma;

  prisma.$executeRawUnsafe(`
    ALTER TABLE imobiliarias
      ADD COLUMN IF NOT EXISTS mcmvHabilitado         TINYINT(1) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS blogMenuHabilitado      TINYINT(1) NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS blogHomepageHabilitado  TINYINT(1) NOT NULL DEFAULT 1
  `).catch((e: unknown) => {
    console.error("[prisma] Aviso ao garantir colunas de toggle:", e);
  });
}
