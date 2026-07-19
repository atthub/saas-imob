import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { nome, cidadeId } = await request.json();
  if (!nome || !cidadeId) {
    return NextResponse.json({ erro: "Informe nome do bairro e a cidade." }, { status: 400 });
  }
  const bairro = await prisma.bairro.upsert({
    where: { nome_cidadeId: { nome, cidadeId } },
    update: {},
    create: { nome, cidadeId }
  });
  return NextResponse.json({ bairro });
}
