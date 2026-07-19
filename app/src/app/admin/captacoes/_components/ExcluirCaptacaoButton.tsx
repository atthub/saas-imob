"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirCaptacaoButton({ captacaoId }: { captacaoId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function excluir() {
    if (!confirm("Excluir esta captação? Essa ação não pode ser desfeita.")) return;
    setCarregando(true);
    await fetch(`/api/captacoes/${captacaoId}`, { method: "DELETE" });
    router.refresh();
    setCarregando(false);
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={carregando}
      title="Excluir captação"
      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-md px-3 py-1.5 transition disabled:opacity-40"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Excluir
    </button>
  );
}
