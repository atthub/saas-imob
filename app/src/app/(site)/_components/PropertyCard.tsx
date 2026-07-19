"use client";

import Link from "next/link";
import { Bed, Car, Ruler, Heart, GitCompareArrows } from "lucide-react";
import { useFavoritos } from "./FavoritosContext";

export type ImovelResumo = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  finalidade: string;
  valorVenda: number | null;
  valorLocacao: number | null;
  quartos: number | null;
  vagasGaragem: number | null;
  areaTotal: number | null;
  fotoCapa: string | null;
  cidade: string | null;
  bairro: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  TERRENO: "Terreno",
  SALA_COMERCIAL: "Sala comercial",
  GALPAO: "Galpão",
  CHACARA: "Chácara",
  KITNET: "Kitnet",
  ESPACO_FESTAS: "Espaço para festas",
  OUTRO: "Imóvel"
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PropertyCard({ imovel }: { imovel: ImovelResumo }) {
  const { toggleFavorito, isFavorito, toggleComparar, isComparando, comparar } = useFavoritos();
  const favoritado = isFavorito(imovel.id);
  const comparando = isComparando(imovel.id);
  const comparacaoLlena = comparar.length >= 3 && !comparando;

  return (
    <div className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition relative">
      {/* Botões flutuantes */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={(e) => {
            e.preventDefault();
            toggleFavorito(imovel);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition ${
            favoritado
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white"
          }`}
        >
          <Heart className="w-4 h-4" fill={favoritado ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label={comparando ? "Remover da comparação" : "Comparar"}
          onClick={(e) => {
            e.preventDefault();
            if (!comparacaoLlena) toggleComparar(imovel.id);
          }}
          title={comparacaoLlena ? "Máximo de 3 imóveis para comparar" : undefined}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition ${
            comparando
              ? "bg-brand-goldVivid text-white"
              : comparacaoLlena
              ? "bg-white/60 text-gray-300 cursor-not-allowed"
              : "bg-white/90 text-gray-500 hover:text-brand-goldVivid hover:bg-white"
          }`}
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>
      </div>

      <Link href={`/imoveis/${imovel.id}`} className="block">
        {/* Container com overflow-hidden para clipar o zoom da imagem */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imovel.fotoCapa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imovel.fotoCapa}
              alt={imovel.titulo}
              className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem foto</div>
          )}
          <span className="absolute top-3 left-3 bg-brand-dark text-white text-xs font-semibold px-2 py-1 rounded-md">
            {imovel.finalidade === "LOCACAO"
              ? "Aluguel"
              : imovel.finalidade === "VENDA_E_LOCACAO"
              ? "Venda e Aluguel"
              : "Venda"}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-gray-400">{TIPO_LABEL[imovel.tipo] || imovel.tipo} · {imovel.codigo}</span>
          <h3 className="font-heading font-semibold text-brand-dark mt-1 line-clamp-2">{imovel.titulo}</h3>
          {(imovel.bairro || imovel.cidade) && (
            <p className="text-sm text-gray-500 mt-1">
              {[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {!!imovel.quartos && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-brand-goldVivid" /> {imovel.quartos} quartos
              </span>
            )}
            {!!imovel.vagasGaragem && (
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-brand-goldVivid" /> {imovel.vagasGaragem} vagas
              </span>
            )}
            {!!imovel.areaTotal && (
              <span className="flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-brand-goldVivid" /> {imovel.areaTotal} m²
              </span>
            )}
          </div>

          <div className="mt-3 font-heading text-lg font-bold text-brand-goldVivid">
            {imovel.finalidade === "LOCACAO" && imovel.valorLocacao
              ? `${formatarMoeda(imovel.valorLocacao)}/mês`
              : imovel.finalidade === "VENDA_E_LOCACAO" && imovel.valorVenda && imovel.valorLocacao
              ? `${formatarMoeda(imovel.valorVenda)} · ${formatarMoeda(imovel.valorLocacao)}/mês`
              : imovel.valorVenda
              ? formatarMoeda(imovel.valorVenda)
              : imovel.valorLocacao
              ? `${formatarMoeda(imovel.valorLocacao)}/mês`
              : "Consulte"}
          </div>
        </div>
      </Link>
    </div>
  );
}
