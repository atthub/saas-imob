"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirLandingPageButton({ id }: { id: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (!confirm("Excluir esta landing page? Esta ação não pode ser desfeita.")) return;
    setExcluindo(true);
    await fetch(`/api/landing-pages/${id}`, { method: "DELETE" });
    setExcluindo(false);
    router.refresh();
  }

  return (
    <button
      onClick={excluir}
      disabled={excluindo}
      title="Excluir landing page"
      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
    >
      <Trash2 size={16} />
    </button>
  );
}
