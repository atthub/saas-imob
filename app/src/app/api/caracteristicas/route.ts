import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Catálogo global de características de imóvel (Suíte, Closet, Piscina...)
export async function GET() {
  const caracteristicas = await prisma.caracteristica.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json({ caracteristicas });
}

export async function POST(request: NextRequest) {
  const { nome, icone } = await request.json();
  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome da característica." }, { status: 400 });
  }
  const caracteristica = await prisma.caracteristica.upsert({
    where: { nome },
    update: { icone },
    create: { nome, icone }
  });
  return NextResponse.json({ caracteristica });
}
