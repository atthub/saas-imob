"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoProprietarioForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const resposta = await fetch("/api/proprietarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone, email: email || undefined, observacoes: observacoes || undefined })
    });

    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Erro ao salvar. Tente novamente.");
      return;
    }

    router.push(`/admin/proprietarios/${data.proprietario.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
      {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          placeholder="Nome completo do proprietário"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
        <input
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          placeholder="(00) 00000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          placeholder="opcional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
          placeholder="Informações internas (não exibidas no site)"
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar proprietário"}
      </button>
    </form>
  );
}
