import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verificarTokenSessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(request: NextRequest) {
  // Lê sessão antes de apagar o cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const sessao = await verificarTokenSessao(token).catch(() => null);
    if (sessao && sessao.papel !== "SUPER_ADMIN") {
      registrarAuditoria({
        imobiliariaId: sessao.imobiliariaId,
        usuarioId: sessao.usuarioId,
        usuarioNome: sessao.nome,
        acao: "LOGOUT",
        ip: request.headers.get("x-forwarded-for") || null
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
