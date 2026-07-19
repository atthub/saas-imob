"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcluirComissaoButton({ id }: { id: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (!confirm("Excluir esta comissão?")) return;
    setExcluindo(true);
    await fetch(`/api/comissoes/${id}`, { method: "DELETE" });
    router.refresh();
    setExcluindo(false);
  }

  return (
    <button onClick={excluir} disabled={excluindo} className="text-red-600 disabled:opacity-50">
      Excluir
    </button>
  );
}
