"use client";

import { useEffect, useRef, useState } from "react";
import PropertyCard from "../../_components/PropertyCard";
import type { ImovelResumo } from "@/lib/imoveisPublicos";

interface Props {
  imoveisIniciais: ImovelResumo[];
  itensPorLote: number;
  searchParams: Record<string, string | undefined>;
}

export default function ImoveisScrollInfinito({ imoveisIniciais, itensPorLote, searchParams }: Props) {
  const [imoveis, setImoveis] = useState<ImovelResumo[]>(imoveisIniciais);
  const [pagina, setPagina] = useState(2);
  const [carregando, setCarregando] = useState(false);
  const [semMais, setSemMais] = useState(imoveisIniciais.length < itensPorLote);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  async function carregarMais() {
    if (carregando || semMais) return;
    setCarregando(true);
    const params = new URLSearchParams();
    params.set("pagina", String(pagina));
    params.set("limite", String(itensPorLote));
    if (searchParams.finalidade) params.set("finalidade", searchParams.finalidade);
    if (searchParams.tipo) params.set("tipo", searchParams.tipo);
    if (searchParams.busca) params.set("busca", searchParams.busca);
    if (searchParams.precoMin) params.set("precoMin", searchParams.precoMin);
    if (searchParams.precoMax) params.set("precoMax", searchParams.precoMax);
    if (searchParams.ordenacao) params.set("ordenacao", searchParams.ordenacao);

    const r = await fetch(`/api/imoveis/publicos?${params.toString()}`);
    if (r.ok) {
      const d = await r.json();
      const novos: ImovelResumo[] = d.imoveis || [];
      setImoveis((prev) => [...prev, ...novos]);
      setPagina((p) => p + 1);
      if (novos.length < itensPorLote) setSemMais(true);
    } else {
      setSemMais(true);
    }
    setCarregando(false);
  }

  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) carregarMais();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinela);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, carregando, semMais]);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {imoveis.map((imovel) => (
          <PropertyCard key={imovel.id} imovel={imovel} />
        ))}
      </div>

      <div ref={sentinelaRef} className="py-6 text-center text-sm text-gray-400">
        {carregando && "Carregando mais imóveis..."}
        {semMais && imoveis.length > 0 && "Todos os imóveis foram exibidos."}
      </div>
    </>
  );
}
