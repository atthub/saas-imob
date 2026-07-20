/**
 * instrumentation.ts — executado automaticamente pelo Next.js a cada restart do servidor.
 *
 * Garante que colunas de toggle existam na tabela imobiliarias.
 * Usa ADD COLUMN IF NOT EXISTS, então é seguro rodar múltiplas vezes.
 * Isso previne que backups do banco ou recreações de schema apaguem as colunas.
 */
export async function register() {
  // Só executa no runtime Node.js (não no Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { prisma } = await import('@/lib/prisma');

      await prisma.$executeRawUnsafe(`
        ALTER TABLE imobiliarias
          ADD COLUMN IF NOT EXISTS mcmvHabilitado         TINYINT(1) NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS blogMenuHabilitado      TINYINT(1) NOT NULL DEFAULT 1,
          ADD COLUMN IF NOT EXISTS blogHomepageHabilitado  TINYINT(1) NOT NULL DEFAULT 1
      `);

      console.log('[startup] Colunas de toggle verificadas com sucesso.');
    } catch (err) {
      // Não bloqueia o boot — loga o erro mas deixa o app subir normalmente
      console.error('[startup] Aviso ao verificar colunas de toggle:', err);
    }
  }
}
