"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarcarPagoButton({ id }: { id: string }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  async function marcarPago() {
    setSalvando(true);
    await fetch(`/api/comissoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" })
    });
    router.refresh();
    setSalvando(false);
  }

  return (
    <button onClick={marcarPago} disabled={salvando} className="text-green-600 disabled:opacity-50">
      {salvando ? "Salvando..." : "Marcar pago"}
    </button>
  );
}
