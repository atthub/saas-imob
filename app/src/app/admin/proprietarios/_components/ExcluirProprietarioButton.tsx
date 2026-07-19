"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirProprietarioButton({ proprietarioId }: { proprietarioId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function excluir() {
    if (!confirm("Excluir este proprietário? Essa ação não pode ser desfeita.")) return;
    setCarregando(true);
    const r = await fetch(`/api/proprietarios/${proprietarioId}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.erro || "Erro ao excluir proprietário.");
      setCarregando(false);
      return;
    }
    router.refresh();
    setCarregando(false);
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={carregando}
      title="Excluir proprietário"
      className="p-1.5 text-gray-400 hover:text-red-500 transition disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
