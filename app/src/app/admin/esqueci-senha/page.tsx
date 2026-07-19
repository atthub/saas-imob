"use client";

import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setEnviando(true);

    const resposta = await fetch("/api/auth/esqueci-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    setEnviando(false);
    const data = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      setErro(data.erro || "Ocorreu um erro. Tente novamente.");
      return;
    }

    setMensagem(data.mensagem || "Verifique seu e-mail.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-5">
        <div className="flex justify-center mb-2">
          <img
            src="https://imob.attitudehub.com.br/logo-vitrine-imob.png"
            alt="Vitrine Imob"
            className="h-16 w-auto"
          />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-brand-dark">Esqueci minha senha</h1>
          <p className="text-sm text-gray-500 mt-1">
            Informe seu e-mail e enviaremos um link para redefinir a senha.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>
        )}

        {mensagem ? (
          <div className="bg-green-50 text-green-700 text-sm rounded-md px-4 py-3 text-center">
            {mensagem}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="seuemail@imobiliaria.com.br"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/admin/login" className="text-sm text-brand-gold hover:underline">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
