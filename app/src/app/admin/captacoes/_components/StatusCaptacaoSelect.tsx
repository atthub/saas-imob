"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  recusado: "Recusado"
};

export default function StatusCaptacaoSelect({ id, statusAtual }: { id: string; statusAtual: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(statusAtual);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterar(novoStatus: string) {
    setStatus(novoStatus);
    setSalvando(true);
    setErro(null);

    const resposta = await fetch(`/api/captacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus })
    });
    setSalvando(false);

    if (!resposta.ok) {
      setStatus(statusAtual);
      setErro("Não foi possível atualizar.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {erro && <span className="text-xs text-red-600">{erro}</span>}
      <select
        value={status}
        disabled={salvando}
        onChange={(e) => alterar(e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:opacity-60"
      >
        {Object.entries(STATUS_LABEL).map(([valor, label]) => (
          <option key={valor} value={valor}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
