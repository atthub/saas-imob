"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function BuscaImoveis() {
  const router = useRouter();
  const [finalidade, setFinalidade] = useState("VENDA");
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (finalidade) params.set("finalidade", finalidade);
    if (tipo) params.set("tipo", tipo);
    if (busca) params.set("busca", busca);
    router.push(`/imoveis?${params.toString()}`);
  }

  return (
    <form
      onSubmit={pesquisar}
      className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-3 w-full max-w-3xl"
    >
      <select
        value={finalidade}
        onChange={(e) => setFinalidade(e.target.value)}
        className="border border-gray-200 rounded-md px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold"
      >
        <option value="VENDA">Comprar</option>
        <option value="LOCACAO">Alugar</option>
      </select>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="border border-gray-200 rounded-md px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold"
      >
        <option value="">Tipo de imóvel</option>
        <option value="CASA">Casa</option>
        <option value="APARTAMENTO">Apartamento</option>
        <option value="TERRENO">Terreno</option>
        <option value="SALA_COMERCIAL">Sala comercial</option>
        <option value="GALPAO">Galpão</option>
        <option value="CHACARA">Chácara</option>
        <option value="KITNET">Kitnet</option>
        <option value="ESPACO_FESTAS">Espaço para festas</option>
        <option value="OUTRO">Outro</option>
      </select>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Bairro, cidade ou código"
        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold"
      />

      <button
        type="submit"
        className="bg-brand-goldVivid text-white font-semibold rounded-md px-6 py-2 text-sm hover:opacity-90 transition flex items-center gap-1.5 justify-center"
      >
        <Search className="w-4 h-4" />
        Buscar
      </button>
    </form>
  );
}
