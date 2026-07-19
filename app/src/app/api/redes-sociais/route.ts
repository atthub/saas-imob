import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";

const PLATAFORMAS_VALIDAS = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "whatsapp"];

// GET /api/redes-sociais -> lista as redes sociais cadastradas pela
// imobiliária da sessão atual, ordenadas (usadas no Topbar/Footer do site).
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const redesSociais = await prisma.redeSocial.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { ordem: "asc" }
  });

  return NextResponse.json({ redesSociais });
}

// POST /api/redes-sociais -> adiciona uma nova rede social ao final da lista.
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel === "CORRETOR") {
    return NextResponse.json({ erro: "Sem permissão para alterar configurações." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const plataforma = typeof body.plataforma === "string" ? body.plataforma.trim().toLowerCase() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!PLATAFORMAS_VALIDAS.includes(plataforma)) {
    return NextResponse.json(
      { erro: `Plataforma inválida. Use uma destas: ${PLATAFORMAS_VALIDAS.join(", ")}.` },
      { status: 400 }
    );
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ erro: "Informe uma URL válida, começando com http:// ou https://." }, { status: 400 });
  }

  const maiorOrdem = await prisma.redeSocial.aggregate({
    where: { imobiliariaId: sessao.imobiliariaId },
    _max: { ordem: true }
  });

  const redeSocial = await prisma.redeSocial.create({
    data: {
      imobiliariaId: sessao.imobiliariaId,
      plataforma,
      url,
      ordem: (maiorOrdem._max.ordem ?? -1) + 1
    }
  });

  return NextResponse.json({ redeSocial }, { status: 201 });
}
