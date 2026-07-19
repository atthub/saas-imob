"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
  ALUGADO: "Alugado",
  INATIVO: "Inativo (rascunho)"
};

export default function ImovelVinculadoItem({
  proprietarioId,
  imovel
}: {
  proprietarioId: string;
  imovel: { id: string; codigo: string; titulo: string; status: string };
}) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState(false);

  async function desvincular() {
    if (!window.confirm("Remover o vínculo deste imóvel com o proprietário?")) return;
    setRemovendo(true);
    const resposta = await fetch(`/api/proprietarios/${proprietarioId}/desvincular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imovelId: imovel.id })
    });
    setRemovendo(false);
    if (resposta.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <a href={`/admin/imoveis/${imovel.id}/editar`} className="text-sm hover:underline">
        <span className="font-medium text-brand-dark">{imovel.codigo}</span> — {imovel.titulo}
        <span className="text-gray-400 text-xs ml-2">{STATUS_LABEL[imovel.status] || imovel.status}</span>
      </a>
      <button
        type="button"
        onClick={desvincular}
        disabled={removendo}
        aria-label="Remover vínculo"
        title="Remover vínculo"
        className="text-gray-400 hover:text-red-600 disabled:opacity-60"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
