"use client";

import { useRef, useState } from "react";
import Script from "next/script";

// turnstileSiteKey vem como prop do Server Component pai,
// que lê process.env em runtime — correto para multi-tenant.
export default function LeadForm({
  imovelId,
  imobiliariaId,
  turnstileSiteKey = ""
}: {
  imovelId: string;
  imobiliariaId: string;
  turnstileSiteKey?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("Tenho interesse neste imóvel, podem me passar mais informações?");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const tokenInput = formRef.current?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
    const turnstileToken = tokenInput?.value || (turnstileSiteKey ? "" : "sem-captcha");

    if (turnstileSiteKey && !turnstileToken) {
      setErro("Confirme o captcha antes de enviar.");
      return;
    }

    setEnviando(true);
    const resposta = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone, mensagem, imovelId, imobiliariaId, turnstileToken })
    });
    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível enviar. Tente novamente.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
        Recebemos seu contato! Em breve um corretor vai falar com você.
      </div>
    );
  }

  return (
    <>
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      )}

      <form ref={formRef} onSubmit={enviar} className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-brand-dark">Tenho interesse</h3>
        {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
        <input
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Seu telefone / WhatsApp"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />

        {turnstileSiteKey && (
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-brand-goldVivid text-white font-semibold rounded-md px-5 py-2 text-sm hover:opacity-90 transition disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Quero falar com um corretor"}
        </button>
      </form>
    </>
  );
}
