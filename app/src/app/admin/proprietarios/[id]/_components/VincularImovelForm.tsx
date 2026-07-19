"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImovelDisponivel = { id: string; codigo: string; titulo: string };

export default function VincularImovelForm({
  proprietarioId,
  imoveisDisponiveis
}: {
  proprietarioId: string;
  imoveisDisponiveis: ImovelDisponivel[];
}) {
  const router = useRouter();
  const [imovelId, setImovelId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function vincular(e: React.FormEvent) {
    e.preventDefault();
    if (!imovelId) return;
    setErro(null);
    setSalvando(true);

    const resposta = await fetch(`/api/proprietarios/${proprietarioId}/vincular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imovelId })
    });
    setSalvando(false);

    if (!resposta.ok) {
      const data = await resposta.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível vincular este imóvel.");
      return;
    }

    setImovelId("");
    router.refresh();
  }

  if (imoveisDisponiveis.length === 0) {
    return <p className="text-sm text-gray-400">Não há imóveis sem proprietário vinculado para selecionar.</p>;
  }

  return (
    <form onSubmit={vincular} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Vincular imóvel já cadastrado</label>
        <select
          value={imovelId}
          onChange={(e) => setImovelId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Selecione um imóvel...</option>
          {imoveisDisponiveis.map((imovel) => (
            <option key={imovel.id} value={imovel.id}>
              {imovel.codigo} — {imovel.titulo}
            </option>
          ))}
        </select>
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
      </div>
      <button
        type="submit"
        disabled={!imovelId || salvando}
        className="bg-brand-goldVivid text-white font-semibold px-4 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60"
      >
        {salvando ? "Vinculando..." : "Vincular"}
      </button>
    </form>
  );
}
