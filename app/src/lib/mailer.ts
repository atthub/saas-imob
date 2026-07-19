// Envio de e-mail via Resend (resend.com)
// Configure RESEND_API_KEY no .env do servidor.
// Configure RESEND_FROM com um remetente do domínio verificado no Resend,
// ex: "Vitrine Imob <noreply@attitudehub.com.br>"
// Enquanto o domínio não estiver verificado, use "onboarding@resend.dev" (só envia para o dono da conta).

export async function enviarEmail({
  para,
  assunto,
  html
}: {
  para: string;
  assunto: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const from = process.env.RESEND_FROM || "Vitrine Imob <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [para], subject: assunto, html })
  });

  if (!res.ok) {
    const erro = await res.text();
    throw new Error(`Resend error ${res.status}: ${erro}`);
  }
}
