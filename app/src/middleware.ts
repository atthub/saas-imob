import { NextRequest, NextResponse } from "next/server";
import { verificarTokenSessao, SESSION_COOKIE_NAME } from "@/lib/auth";

// ─── Rate limiting em memória ────────────────────────────────────────────────
// Funciona bem em deployments Node.js persistentes (cPanel com node server.js).
// Chave: "ip:rota" → { contagem, resetEm }
const rateStore = new Map<string, { count: number; resetAt: number }>();

// Limites por rota pública sensível (janela de 60 segundos)
const RATE_LIMITS: { path: string; method: string; max: number; windowMs: number }[] = [
  { path: "/api/leads",     method: "POST", max: 5,  windowMs: 60_000 },
  { path: "/api/captacoes", method: "POST", max: 3,  windowMs: 60_000 },
  { path: "/admin/login",   method: "POST", max: 10, windowMs: 300_000 } // 5min
];

function checkRateLimit(ip: string, pathname: string, method: string): boolean {
  const regra = RATE_LIMITS.find(
    (r) => pathname.startsWith(r.path) && method === r.method
  );
  if (!regra) return true; // sem regra → permitido

  const chave = `${ip}:${regra.path}`;
  const agora = Date.now();
  const entrada = rateStore.get(chave);

  if (!entrada || agora > entrada.resetAt) {
    rateStore.set(chave, { count: 1, resetAt: agora + regra.windowMs });
    return true;
  }

  if (entrada.count >= regra.max) return false;

  entrada.count++;
  return true;
}

// Limpeza periódica para não acumular entradas expiradas
setInterval(() => {
  const agora = Date.now();
  for (const [chave, val] of rateStore.entries()) {
    if (agora > val.resetAt) rateStore.delete(chave);
  }
}, 60_000);

// ─── Módulos de permissão por rota admin ────────────────────────────────────
const MODULO_POR_ROTA: { prefixo: string; modulo: string }[] = [
  { prefixo: "/admin/usuarios",      modulo: "usuarios" },
  { prefixo: "/admin/imoveis",       modulo: "imoveis" },
  { prefixo: "/admin/leads",         modulo: "leads" },
  { prefixo: "/admin/corretores",    modulo: "corretores" },
  { prefixo: "/admin/captacoes",     modulo: "captacoes" },
  { prefixo: "/admin/proprietarios", modulo: "proprietarios" },
  { prefixo: "/admin/banners",       modulo: "banners" },
  { prefixo: "/admin/configuracoes", modulo: "configuracoes" }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestMethod = request.method;

  // ── Rate limiting (rotas públicas sensíveis) ──────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip, pathname, requestMethod)) {
    return new NextResponse(
      JSON.stringify({ erro: "Muitas tentativas. Aguarde um momento e tente novamente." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      }
    );
  }

  // ── Proteção do painel admin ──────────────────────────────────────────────
  const rotasPublicas = ["/admin/login", "/admin/esqueci-senha", "/admin/redefinir-senha"];
  const isRotaPublica = rotasPublicas.some(r => pathname.startsWith(r));
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute || isRotaPublica) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessao = token ? await verificarTokenSessao(token) : null;

  if (!sessao) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // SUPER_ADMIN e ADMIN têm acesso total ao painel da imobiliária.
  // Apenas CORRETORs são restritos pelos módulos de permissão.
  if (sessao.papel === "CORRETOR") {
    const secao = MODULO_POR_ROTA.find((item) => pathname.startsWith(item.prefixo));
    if (secao) {
      const permissoes = Array.isArray(sessao.permissoes) ? sessao.permissoes : [];
      const bloqueado = secao.modulo === "usuarios" || !permissoes.includes(secao.modulo);

      if (bloqueado) {
        const semPermissaoUrl = new URL("/admin", request.url);
        semPermissaoUrl.searchParams.set("semPermissao", "1");
        return NextResponse.redirect(semPermissaoUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Inclui rotas públicas sensíveis + todas as rotas admin
  matcher: ["/admin/:path*", "/api/leads", "/api/captacoes"]
};
