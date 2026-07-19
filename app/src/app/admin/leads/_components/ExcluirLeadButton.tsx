"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function excluir() {
    if (!confirm("Excluir este lead? Essa ação não pode ser desfeita.")) return;
    setCarregando(true);
    await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    router.refresh();
    setCarregando(false);
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={carregando}
      title="Excluir lead"
      className="p-1.5 text-gray-400 hover:text-red-500 transition disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
