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

// Garante schema na primeira inicialização do processo.
// Funciona com Phusion Passenger, next start ou qualquer runtime Node.js.
if (!globalForPrisma.schemaInited) {
  globalForPrisma.schemaInited = true;
  globalForPrisma.prisma = prisma;

  // 1) Garante colunas legadas em imobiliarias (mcmvHabilitado)
  prisma.$executeRawUnsafe(`
    ALTER TABLE imobiliarias
      ADD COLUMN IF NOT EXISTS mcmvHabilitado TINYINT(1) NOT NULL DEFAULT 0
  `).catch((e: unknown) => {
    console.error("[prisma] Aviso ao garantir colunas legadas:", e);
  });

  // 2) Cria tabela chave-valor configuracoes_imobiliaria se não existir
  prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS configuracoes_imobiliaria (
      id            VARCHAR(30)  NOT NULL,
      imobiliariaId VARCHAR(30)  NOT NULL,
      chave         VARCHAR(100) NOT NULL,
      valor         TEXT,
      criadoEm      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      atualizadoEm  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_imob_chave (imobiliariaId, chave),
      KEY idx_imobiliaria (imobiliariaId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `).catch((e: unknown) => {
    console.error("[prisma] Aviso ao criar configuracoes_imobiliaria:", e);
  });
}
