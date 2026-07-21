"use client";

import { useRef, useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import Script from "next/script";

type Props = {
  promocaoId: string;
  promocaoTitulo: string;
  imobiliariaId: string;
  turnstileSiteKey?: string;
};

export default function FormLeadPromocao({ promocaoId, promocaoTitulo, imobiliariaId, turnstileSiteKey = "" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) { setErro("Nome e telefone são obrigatórios."); return; }
    setErro(null);

    const tokenInput = formRef.current?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
    const turnstileToken = tokenInput?.value || (turnstileSiteKey ? "" : "sem-captcha");

    if (turnstileSiteKey && !turnstileToken) {
      setErro("Confirme o captcha antes de enviar.");
      return;
    }

    setEnviando(true);

    const r = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome.trim(),
        telefone: telefone.trim(),
        mensagem: mensagem.trim() || `Interesse na promoção: ${promocaoTitulo}`,
        imobiliariaId,
        promocaoId,
        origem: "promocao",
        turnstileToken
      })
    });

    setEnviando(false);
    if (r.ok) {
      setEnviado(true);
    } else {
      const d = await r.json().catch(() => ({}));
      setErro(d.erro || "Não foi possível enviar. Tente novamente.");
    }
  }

  if (enviado) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mt-4">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Mensagem recebida!</p>
          <p className="text-xs text-green-700">Entraremos em contato em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      )}
      <form ref={formRef} onSubmit={enviar} className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
        <p className="text-sm font-semibold text-brand-dark">Participe dessa promoção</p>
        {erro && <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              placeholder="Seu nome"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefone / WhatsApp *</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mensagem (opcional)</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm bg-white resize-none"
            placeholder="Dúvidas ou comentários..."
          />
        </div>
        {turnstileSiteKey && (
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
        )}
        <button
          type="submit"
          disabled={enviando}
          className="flex items-center gap-2 bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60 transition"
        >
          <Send className="w-4 h-4" />
          {enviando ? "Enviando..." : "Enviar interesse"}
        </button>
      </form>
    </>
  );
}
