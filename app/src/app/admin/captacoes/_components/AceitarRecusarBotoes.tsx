"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X, ExternalLink } from "lucide-react";

export default function AceitarRecusarBotoes({
  id,
  status,
  imovelCriadoId
}: {
  id: string;
  status: string;
  imovelCriadoId: string | null;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState<"aceitar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function aceitar() {
    setErro(null);
    setCarregando("aceitar");
    const resposta = await fetch(`/api/captacoes/${id}/aceitar`, { method: "POST" });
    const data = await resposta.json().catch(() => ({}));
    setCarregando(null);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível aceitar esta captação.");
      return;
    }

    router.push(`/admin/imoveis/${data.imovel.id}/editar`);
  }

  async function recusar() {
    if (!window.confirm("Recusar esta captação? O proprietário não terá o imóvel cadastrado.")) return;
    setErro(null);
    setCarregando("recusar");
    const resposta = await fetch(`/api/captacoes/${id}/recusar`, { method: "POST" });
    setCarregando(null);

    if (!resposta.ok) {
      setErro("Não foi possível recusar esta captação.");
      return;
    }

    router.refresh();
  }

  if (status === "aprovado") {
    return (
      <div className="flex items-center gap-2 text-xs">
        {imovelCriadoId ? (
          <a
            href={`/admin/imoveis/${imovelCriadoId}/editar`}
            className="flex items-center gap-1 text-green-700 font-medium hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver imóvel cadastrado
          </a>
        ) : (
          <span className="text-green-700 font-medium">Aceita</span>
        )}
      </div>
    );
  }

  if (status === "recusado") {
    return <span className="text-xs text-gray-400 font-medium">Recusada</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {erro && <span className="text-xs text-red-600">{erro}</span>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={recusar}
          disabled={carregando !== null}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 disabled:opacity-60"
        >
          {carregando === "recusar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          Recusar
        </button>
        <button
          type="button"
          onClick={aceitar}
          disabled={carregando !== null}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-brand-goldVivid rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
        >
          {carregando === "aceitar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Aceitar
        </button>
      </div>
    </div>
  );
}
