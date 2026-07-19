"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export default function CriarLandingPageButton({ imovelId }: { imovelId: string }) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);

  async function criar() {
    setCriando(true);
    const r = await fetch("/api/landing-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imovelId, status: "rascunho" })
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.erro || "Não foi possível criar a landing page.");
      setCriando(false);
      return;
    }
    const d = await r.json();
    router.push(`/admin/landing-pages/${d.landingPage.id}`);
  }

  return (
    <button
      onClick={criar}
      disabled={criando}
      className="flex items-center gap-2 text-sm border border-brand-gold text-brand-gold rounded-md px-3 py-1.5 hover:bg-brand-gold/5 transition disabled:opacity-60"
    >
      <FileText size={15} />
      {criando ? "Criando..." : "Landing Page Exclusiva"}
    </button>
  );
}
