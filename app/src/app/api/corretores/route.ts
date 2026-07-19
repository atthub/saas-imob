import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { corretorSchema } from "@/lib/validators/corretor";
import { registrarAuditoria } from "@/lib/auditoria";

function podeGerenciarCorretores(sessao: { papel: string } | null) {
  return !!sessao && (sessao.papel === "ADMIN" || sessao.papel === "SUPER_ADMIN");
}

// GET /api/corretores -> lista corretores da imobiliária logada
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const corretores = await prisma.corretor.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { nome: "asc" }
  });

  return NextResponse.json({ corretores });
}

// POST /api/corretores -> cadastra um novo corretor
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId || !podeGerenciarCorretores(sessao)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = corretorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dados = parsed.data;

  const corretor = await prisma.corretor.create({
    data: {
      nome: dados.nome,
      telefone: dados.telefone,
      whatsapp: dados.whatsapp || undefined,
      email: dados.email || undefined,
      creci: dados.creci || undefined,
      ativo: dados.ativo,
      imobiliariaId: sessao.imobiliariaId
    }
  });

  if (sessao.papel !== "SUPER_ADMIN") {
    registrarAuditoria({
      imobiliariaId: sessao.imobiliariaId,
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      acao: "CORRETOR_CRIADO",
      entidade: "corretor",
      entidadeId: corretor.id,
      detalhes: { nome: corretor.nome },
      ip: request.headers.get("x-forwarded-for") || null
    });
  }

  return NextResponse.json({ ok: true, corretor }, { status: 201 });
}
