"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExcluirArtigoButton({ id }: { id: string }) {
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function excluir() {
    if (!confirm("Excluir este artigo permanentemente?")) return;
    setCarregando(true);
    await fetch(`/api/admin/artigos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={excluir} disabled={carregando} title="Excluir"
      className="p-2 rounded-md text-red-400 hover:bg-red-50 transition disabled:opacity-50">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
