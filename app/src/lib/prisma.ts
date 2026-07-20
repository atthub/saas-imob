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

  // 1) Cria tabela chave-valor configuracoes_imobiliaria se não existir
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
  `).then(() => {
    // 2) Migração one-time: copia toggles das colunas legadas da tabela imobiliarias
    //    para configuracoes_imobiliaria. INSERT IGNORE não sobrescreve valores já salvos.
    //    Cada bloco é envolvido em catch individual pois a coluna pode não existir.
    const migracoesBoolean = [
      "mcmvHabilitado",
      "xmlHabilitado",
      "landingPagesHabilitado",
      "comissoesHabilitado",
    ];
    for (const chave of migracoesBoolean) {
      prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO configuracoes_imobiliaria (id, imobiliariaId, chave, valor, criadoEm, atualizadoEm)
        SELECT SUBSTR(MD5(CONCAT(id, '${chave}')), 1, 25), id, '${chave}',
               IF(${chave} = 1, 'true', 'false'), NOW(3), NOW(3)
        FROM imobiliarias
        WHERE ${chave} = 1
      `).catch(() => { /* coluna pode não existir — ignorar */ });
    }
    // xmlToken é string, não boolean
    prisma.$executeRawUnsafe(`
      INSERT IGNORE INTO configuracoes_imobiliaria (id, imobiliariaId, chave, valor, criadoEm, atualizadoEm)
      SELECT SUBSTR(MD5(CONCAT(id, 'xmlToken')), 1, 25), id, 'xmlToken',
             xmlToken, NOW(3), NOW(3)
      FROM imobiliarias
      WHERE xmlToken IS NOT NULL AND xmlToken != ''
    `).catch(() => { /* coluna pode não existir — ignorar */ });
  }).catch((e: unknown) => {
    console.error("[prisma] Aviso ao criar configuracoes_imobiliaria:", e);
  });
}
