"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function RedefinirSenhaForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setErro("Link inválido. Solicite um novo link de redefinição.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);

    const resposta = await fetch("/api/auth/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha })
    });

    setEnviando(false);
    const data = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      setErro(data.erro || "Ocorreu um erro. Tente novamente.");
      return;
    }

    setSucesso(true);
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-5">
      <div className="flex justify-center mb-2">
        <img
          src="https://imob.attitudehub.com.br/logo-vitrine-imob.png"
          alt="Vitrine Imob"
          className="h-16 w-auto"
        />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-brand-dark">Redefinir senha</h1>
        <p className="text-sm text-gray-500 mt-1">Digite sua nova senha abaixo.</p>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>
      )}

      {sucesso ? (
        <div className="space-y-4">
          <div className="bg-green-50 text-green-700 text-sm rounded-md px-4 py-3 text-center">
            Senha redefinida com sucesso!
          </div>
          <Link
            href="/admin/login"
            className="block w-full text-center bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition"
          >
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="Repita a nova senha"
            />
          </div>
          <button
            type="submit"
            disabled={enviando || !token}
            className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
          >
            {enviando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}

      {!sucesso && (
        <div className="text-center">
          <Link href="/admin/login" className="text-sm text-brand-gold hover:underline">
            ← Voltar ao login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <RedefinirSenhaForm />
      </Suspense>
    </main>
  );
}
