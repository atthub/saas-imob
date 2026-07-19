"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  inicial: { nome: string; telefone: string; email: string; observacoes: string };
};

export default function EditarProprietarioForm({ id, inicial }: Props) {
  const router = useRouter();
  const [valores, setValores] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function set<K extends keyof typeof valores>(campo: K, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);

    const resposta = await fetch(`/api/proprietarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores)
    });
    setSalvando(false);

    if (!resposta.ok) {
      const data = await resposta.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível salvar.");
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <h2 className="font-semibold text-brand-dark">Dados do proprietário</h2>
      {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}
      {sucesso && <div className="bg-green-50 text-green-700 text-sm rounded-md px-3 py-2">Salvo com sucesso.</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            required
            value={valores.nome}
            onChange={(e) => set("nome", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            required
            value={valores.telefone}
            onChange={(e) => set("telefone", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            value={valores.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={valores.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={salvando}
          className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
