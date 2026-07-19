import { prisma } from "./prisma";

interface RegistroParams {
  imobiliariaId?: string | null;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  acao: string;
  entidade?: string | null;
  entidadeId?: string | null;
  detalhes?: Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * Registra uma ação de auditoria no banco de dados.
 * Erros são silenciosos — auditoria nunca deve quebrar o fluxo principal.
 */
export async function registrarAuditoria(params: RegistroParams) {
  try {
    await prisma.registroAuditoria.create({
      data: {
        imobiliariaId: params.imobiliariaId || null,
        usuarioId: params.usuarioId || null,
        usuarioNome: params.usuarioNome || null,
        acao: params.acao,
        entidade: params.entidade || null,
        entidadeId: params.entidadeId || null,
        detalhes: params.detalhes ? JSON.stringify(params.detalhes) : null,
        ip: params.ip || null
      }
    });
  } catch {
    // Silencioso — auditoria não deve impedir o fluxo principal
  }
}
