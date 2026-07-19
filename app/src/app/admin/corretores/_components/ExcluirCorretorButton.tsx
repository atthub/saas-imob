"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirCorretorButton({ corretorId }: { corretorId: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (!confirm("Excluir este corretor? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    const resposta = await fetch(`/api/corretores/${corretorId}`, { method: "DELETE" });
    const data = await resposta.json().catch(() => ({}));
    setExcluindo(false);
    if (resposta.ok) {
      if (data.aviso) alert(data.aviso);
      router.refresh();
    } else {
      alert(data.erro || "Não foi possível excluir o corretor.");
    }
  }

  return (
    <button onClick={excluir} disabled={excluindo} className="text-red-600 hover:underline disabled:opacity-50">
      {excluindo ? "Excluindo..." : "Excluir"}
    </button>
  );
}
