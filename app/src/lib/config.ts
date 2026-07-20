/**
 * lib/config.ts — helpers para a tabela chave-valor configuracoes_imobiliaria
 *
 * Uso:
 *   const blogMenu = await getConfig(imobiliariaId, "blogMenuHabilitado", true);
 *   await setConfig(imobiliariaId, "blogMenuHabilitado", false);
 */
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// ─── Leitura ────────────────────────────────────────────────────────────────

export async function getConfig(
  imobiliariaId: string,
  chave: string,
  defaultValue: boolean
): Promise<boolean>;
export async function getConfig(
  imobiliariaId: string,
  chave: string,
  defaultValue: string
): Promise<string>;
export async function getConfig(
  imobiliariaId: string,
  chave: string,
  defaultValue: boolean | string
): Promise<boolean | string> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ valor: string | null }>>(
      "SELECT valor FROM configuracoes_imobiliaria WHERE imobiliariaId = ? AND chave = ? LIMIT 1",
      imobiliariaId,
      chave
    );
    if (!rows || rows.length === 0 || rows[0].valor === null) {
      return defaultValue;
    }
    const v = rows[0].valor;
    if (typeof defaultValue === "boolean") {
      return v === "true" || v === "1";
    }
    return v;
  } catch {
    return defaultValue;
  }
}

// ─── Leitura múltipla (uma query só) ────────────────────────────────────────

export async function getConfigs(
  imobiliariaId: string,
  chaves: string[]
): Promise<Record<string, string | null>> {
  if (chaves.length === 0) return {};
  try {
    const placeholders = chaves.map(() => "?").join(", ");
    const rows = await prisma.$queryRawUnsafe<Array<{ chave: string; valor: string | null }>>(
      `SELECT chave, valor FROM configuracoes_imobiliaria WHERE imobiliariaId = ? AND chave IN (${placeholders})`,
      imobiliariaId,
      ...chaves
    );
    const result: Record<string, string | null> = {};
    for (const row of rows) {
      result[row.chave] = row.valor;
    }
    return result;
  } catch {
    return {};
  }
}

// ─── Escrita (upsert) ────────────────────────────────────────────────────────

export async function setConfig(
  imobiliariaId: string,
  chave: string,
  valor: boolean | string | number
): Promise<void> {
  const valorStr = String(valor);
  const id = randomUUID().replace(/-/g, "").slice(0, 25);
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO configuracoes_imobiliaria (id, imobiliariaId, chave, valor)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), atualizadoEm = NOW()`,
      id,
      imobiliariaId,
      chave,
      valorStr
    );
  } catch (e) {
    console.error("[config] Erro ao salvar configuração:", e);
    throw e;
  }
}
