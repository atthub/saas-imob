import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lista cidades cadastradas (com bairros), com busca opcional por nome/UF.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") || undefined;

  const cidades = await prisma.cidade.findMany({
    where: busca ? { nome: { contains: busca } } : undefined,
    include: { bairros: { orderBy: { nome: "asc" } } },
    orderBy: { nome: "asc" }
  });

  return NextResponse.json({ cidades });
}

export async function POST(request: NextRequest) {
  const { nome, uf } = await request.json();
  if (!nome || !uf) {
    return NextResponse.json({ erro: "Informe nome e UF da cidade." }, { status: 400 });
  }
  const cidade = await prisma.cidade.upsert({
    where: { nome_uf: { nome, uf } },
    update: {},
    create: { nome, uf }
  });
  return NextResponse.json({ cidade });
}
