// Verificação server-side do Cloudflare Turnstile (captcha do formulário
// público de captação de imóveis). Documentação:
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Em ambiente de desenvolvimento/local, se TURNSTILE_SECRET_KEY não estiver
// configurada, a verificação é pulada (retorna sucesso) para não travar o
// time enquanto as chaves de produção não foram geradas. Em produção, defina
// a variável de ambiente para que a verificação real seja aplicada.
export async function verificarTurnstile(token: string, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn(
      "TURNSTILE_SECRET_KEY não configurada — verificação de captcha foi pulada. Configure essa variável antes de ir para produção."
    );
    return true;
  }

  if (!token) return false;

  try {
    const resposta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {})
      })
    });
    const dados = await resposta.json();
    if (!dados.success) {
      // Loga os error-codes para facilitar diagnóstico (ex.: hostname-mismatch
      // significa que o domínio atual não está cadastrado no painel do Turnstile).
      console.error("[Turnstile] Verificação falhou. Códigos:", dados["error-codes"], "| Hostname:", dados.hostname);
    }
    return Boolean(dados.success);
  } catch (erro) {
    // Falha de rede ao contactar Cloudflare — deixa passar para não bloquear
    // leads por instabilidade externa. O widget continua protegendo contra bots
    // no lado do cliente.
    console.error("[Turnstile] Erro de rede ao verificar captcha (permitindo):", erro);
    return true;
  }
}
