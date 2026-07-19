"use client";

import { useState } from "react";
import ModalSucesso from "../_components/ModalSucesso";

export default function MinhaContaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    const resposta = await fetch("/api/auth/trocar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha })
    });

    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível trocar a senha.");
      return;
    }

    setSucesso("Senha alterada com sucesso.");
    setMostrarModalSucesso(true);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Minha conta</h1>
        <p className="text-sm text-gray-500">Altere a senha usada para entrar no painel.</p>
      </div>

      <ModalSucesso
        aberto={mostrarModalSucesso}
        mensagem="Senha alterada com sucesso!"
        onClose={() => setMostrarModalSucesso(false)}
      />
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        {erro && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>
        )}
        {sucesso && (
          <div className="bg-green-50 text-green-700 text-sm rounded-md px-3 py-2">{sucesso}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input
            type="password"
            required
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input
            type="password"
            required
            minLength={6}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="Mínimo de 6 caracteres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
        >
          {enviando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
