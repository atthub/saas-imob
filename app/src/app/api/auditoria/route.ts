import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

// GET /api/auditoria -> lista os registros de auditoria da imobiliária
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const registros = await prisma.registroAuditoria.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { criadoEm: "desc" },
    take: 200
  });

  return NextResponse.json({ registros });
}
