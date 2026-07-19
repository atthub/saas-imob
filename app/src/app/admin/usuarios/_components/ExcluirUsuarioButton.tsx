"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirUsuarioButton({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (!confirm("Excluir este usuário? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    const resposta = await fetch(`/api/usuarios/${usuarioId}`, { method: "DELETE" });
    setExcluindo(false);
    if (resposta.ok) {
      router.refresh();
    } else {
      const data = await resposta.json().catch(() => ({}));
      alert(data.erro || "Não foi possível excluir o usuário.");
    }
  }

  return (
    <button onClick={excluir} disabled={excluindo} className="text-red-600 hover:underline disabled:opacity-50">
      {excluindo ? "Excluindo..." : "Excluir"}
    </button>
  );
}
