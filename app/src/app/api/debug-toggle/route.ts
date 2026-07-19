import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao?.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }
  const id = sessao.imobiliariaId;
  const r: Record<string, unknown> = { id };

  // Leitura atual das 3 colunas
  try {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      "SELECT mcmvHabilitado, blogMenuHabilitado, blogHomepageHabilitado FROM imobiliarias WHERE id = ?", id
    );
    r.leitura = rows[0];
    r.tipos = Object.fromEntries(Object.entries(rows[0] || {}).map(([k,v]) => [k, typeof v]));
  } catch (e) { r.erroLeitura = String(e); }

  // Tentar UPDATE mcmv = 1
  try {
    const affected = await prisma.$executeRawUnsafe(
      "UPDATE imobiliarias SET mcmvHabilitado = 1 WHERE id = ?", id
    );
    r.updateOK = true;
    r.rowsAffected = affected;
  } catch (e) { r.erroUpdate = String(e); }

  // Leitura pós-update
  try {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      "SELECT mcmvHabilitado FROM imobiliarias WHERE id = ?", id
    );
    r.leituraPos = rows[0]?.mcmvHabilitado;
    r.tipoPosUpdate = typeof rows[0]?.mcmvHabilitado;
  } catch (e) { r.erroLeituraPos = String(e); }

  return NextResponse.json(r);
}
