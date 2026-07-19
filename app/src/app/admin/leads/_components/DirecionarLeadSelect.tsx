"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Corretor = { id: string; nome: string };

type Props = {
  leadId: string;
  corretores: Corretor[];
  corretorAtualId: string | null;
};

export default function DirecionarLeadSelect({ leadId, corretores, corretorAtualId }: Props) {
  const router = useRouter();
  const [corretorId, setCorretorId] = useState(corretorAtualId || "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function direcionar() {
    if (!corretorId) {
      setErro("Selecione um corretor.");
      return;
    }
    setErro(null);
    setEnviando(true);

    const resposta = await fetch(`/api/leads/${leadId}/direcionar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corretorId })
    });

    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível encaminhar o lead.");
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <ModalSucesso aberto={sucesso} mensagem="Lead encaminhado com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <span className="text-xs text-red-600">{erro}</span>}
      <div className="flex items-center gap-2">
        <select
          value={corretorId}
          onChange={(e) => setCorretorId(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
        >
          <option value="">Selecione...</option>
          {corretores.map((corretor) => (
            <option key={corretor.id} value={corretor.id}>
              {corretor.nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={direcionar}
          disabled={enviando}
          className="bg-brand-goldVivid hover:opacity-90 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition disabled:opacity-60"
        >
          {enviando ? "..." : "Encaminhar"}
        </button>
      </div>
    </div>
  );
}
