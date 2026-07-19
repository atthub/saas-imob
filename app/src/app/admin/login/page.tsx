"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const resposta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    setEnviando(false);

    if (!resposta.ok) {
      const data = await resposta.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível entrar.");
      return;
    }

    // Usamos um recarregamento completo de página (em vez de router.push,
    // que faz uma navegação "client-side" só buscando dados novos) porque,
    // nesse servidor (Apache + Passenger na frente do Next.js), essa
    // navegação client-side estava ficando travada na tela de login mesmo
    // com o cookie de sessão já gravado. Um recarregamento completo sempre
    // funciona, porque é uma requisição nova de verdade ao servidor.
    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-5"
      >
        <div className="flex justify-center mb-2">
          <img
            src="https://imob.attitudehub.com.br/logo-vitrine-imob.png"
            alt="Vitrine Imob"
            className="h-16 w-auto"
          />
        </div>

        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-brand-dark">Painel Administrativo</h1>
          <p className="text-sm text-gray-500">Entre com seu e-mail e senha</p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>
        )}

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-center">
          <Link href="/admin/esqueci-senha" className="text-sm text-brand-gold hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </main>
  );
}
