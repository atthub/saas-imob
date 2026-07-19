"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bed, Car, Ruler, MapPin, ArrowRight,
  Heart, GitCompareArrows, ChevronLeft, ChevronRight
} from "lucide-react";
import { useFavoritos } from "./FavoritosContext";
import type { ImovelResumo } from "./PropertyCard";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getValorLabel(imovel: ImovelResumo): string {
  if (imovel.finalidade === "LOCACAO" && imovel.valorLocacao)
    return `${formatarMoeda(imovel.valorLocacao)}/mês`;
  if (imovel.finalidade === "VENDA_E_LOCACAO" && imovel.valorVenda)
    return formatarMoeda(imovel.valorVenda);
  if (imovel.valorVenda) return formatarMoeda(imovel.valorVenda);
  if (imovel.valorLocacao) return `${formatarMoeda(imovel.valorLocacao)}/mês`;
  return "Consulte";
}

const FINALIDADE_LABEL: Record<string, string> = {
  VENDA: "À venda",
  LOCACAO: "Para alugar",
  VENDA_E_LOCACAO: "Venda e aluguel",
};

export default function DestaqueEspecial({ imoveis }: { imoveis: ImovelResumo[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const { toggleFavorito, isFavorito, toggleComparar, isComparando, comparar } = useFavoritos();

  const proximo = useCallback(() => {
    setAtual((i) => (i + 1) % imoveis.length);
  }, [imoveis.length]);

  const anterior = useCallback(() => {
    setAtual((i) => (i - 1 + imoveis.length) % imoveis.length);
  }, [imoveis.length]);

  useEffect(() => {
    if (pausado || imoveis.length <= 1) return;
    const timer = setInterval(proximo, 5000);
    return () => clearInterval(timer);
  }, [proximo, pausado, imoveis.length]);

  if (imoveis.length === 0) return null;

  const imovel = imoveis[atual];
  const favoritado = isFavorito(imovel.id);
  const comparando = isComparando(imovel.id);
  const comparacaoCheia = comparar.length >= 3 && !comparando;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl min-h-[420px] md:min-h-[500px] bg-brand-dark"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Backgrounds de todos os slides — crossfade via opacity */}
      {imoveis.map((img, i) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === atual ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {img.fotoCapa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.fotoCapa}
              alt={img.titulo}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-800" />
          )}
        </div>
      ))}

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-20 pointer-events-none" />

      {/* Link cobrindo o card inteiro */}
      <Link href={`/imoveis/${imovel.id}`} className="absolute inset-0 z-20" aria-label={imovel.titulo} />

      {/* Badge finalidade */}
      <div className="absolute top-5 left-5 z-30 pointer-events-none">
        <span className="bg-brand-gold text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide uppercase">
          {FINALIDADE_LABEL[imovel.finalidade] || imovel.finalidade}
        </span>
      </div>

      {/* Botões favorito / comparar */}
      <div className="absolute top-5 right-5 z-30 flex gap-2">
        <button
          type="button"
          aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={() => toggleFavorito(imovel)}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition ${
            favoritado ? "bg-red-500 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
          }`}
        >
          <Heart className="w-4 h-4" fill={favoritado ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label={comparando ? "Remover da comparação" : "Comparar"}
          onClick={() => { if (!comparacaoCheia) toggleComparar(imovel.id); }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition ${
            comparando
              ? "bg-brand-goldVivid text-white"
              : comparacaoCheia
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
          }`}
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>
      </div>

      {/* Conteúdo inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-30 pointer-events-none">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2 font-medium">
          {imovel.tipo}
        </p>
        <h3 className="font-heading text-white text-2xl md:text-4xl font-bold leading-tight mb-3 line-clamp-2">
          {imovel.titulo}
        </h3>

        {(imovel.bairro || imovel.cidade) && (
          <p className="text-white/70 text-sm flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
            {[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-5">
          {!!imovel.quartos && (
            <span className="flex items-center gap-1.5 text-white/80 text-sm">
              <Bed className="w-4 h-4 text-brand-gold" /> {imovel.quartos} quartos
            </span>
          )}
          {!!imovel.vagasGaragem && (
            <span className="flex items-center gap-1.5 text-white/80 text-sm">
              <Car className="w-4 h-4 text-brand-gold" /> {imovel.vagasGaragem} vagas
            </span>
          )}
          {!!imovel.areaTotal && (
            <span className="flex items-center gap-1.5 text-white/80 text-sm">
              <Ruler className="w-4 h-4 text-brand-gold" /> {imovel.areaTotal} m²
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-heading text-brand-gold text-2xl md:text-3xl font-bold">
            {getValorLabel(imovel)}
          </span>
          <span className="flex items-center gap-1.5 text-white text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            Ver imóvel <ArrowRight className="w-4 h-4" />
          </span>
        </div>

        {/* Dots */}
        {imoveis.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pointer-events-auto">
            {imoveis.map((_, i) => (
              <button
                key={i}
                onClick={() => setAtual(i)}
                aria-label={`Ir para imóvel ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === atual
                    ? "w-6 h-2 bg-brand-gold"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Setas prev / next */}
      {imoveis.length > 1 && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Imóvel anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={proximo}
            aria-label="Próximo imóvel"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
