"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, GitCompareArrows, Trash2, X, Bed, Car, Ruler, ExternalLink } from "lucide-react";
import { useFavoritos } from "../_components/FavoritosContext";

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

function formatarPreco(imovel: { finalidade: string; valorVenda: number | null; valorLocacao: number | null }) {
  if (imovel.finalidade === "LOCACAO" && imovel.valorLocacao) return `${formatarMoeda(imovel.valorLocacao)}/mês`;
  if (imovel.finalidade === "VENDA_E_LOCACAO" && imovel.valorVenda && imovel.valorLocacao)
    return `${formatarMoeda(imovel.valorVenda)} · ${formatarMoeda(imovel.valorLocacao)}/mês`;
  if (imovel.valorVenda) return formatarMoeda(imovel.valorVenda);
  if (imovel.valorLocacao) return `${formatarMoeda(imovel.valorLocacao)}/mês`;
  return "Consulte";
}

export default function FavoritosPage() {
  const { favoritos, removerFavorito, comparar, toggleComparar, isComparando, limparComparar } = useFavoritos();
  const [modoComparacao, setModoComparacao] = useState(false);

  const imoveisComparar = favoritos.filter((f) => comparar.includes(f.id));

  if (favoritos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">Nenhum favorito salvo</h1>
        <p className="text-gray-500 mb-6">
          Clique no coração nos cards de imóveis para salvá-los aqui.
        </p>
        <Link
          href="/imoveis"
          className="inline-flex bg-brand-goldVivid text-white font-semibold rounded-md px-6 py-2.5 hover:opacity-90 transition"
        >
          Ver imóveis disponíveis
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">Meus Favoritos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {favoritos.length} {favoritos.length === 1 ? "imóvel salvo" : "imóveis salvos"}
          </p>
        </div>
        <div className="flex gap-2">
          {comparar.length >= 2 && (
            <button
              onClick={() => setModoComparacao(true)}
              className="flex items-center gap-1.5 bg-brand-goldVivid text-white text-sm font-semibold rounded-md px-4 py-2 hover:opacity-90 transition"
            >
              <GitCompareArrows className="w-4 h-4" />
              Comparar {comparar.length} imóveis
            </button>
          )}
          {comparar.length > 0 && (
            <button
              onClick={limparComparar}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm rounded-md px-3 py-2 hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Limpar seleção
            </button>
          )}
        </div>
      </div>

      {/* Dica de comparação */}
      {comparar.length === 0 && (
        <div className="mb-6 bg-brand-light border border-brand-gold/30 rounded-lg px-4 py-3 text-sm text-brand-dark flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-brand-goldVivid shrink-0" />
          Marque até 3 imóveis com o ícone de comparação para vê-los lado a lado.
        </div>
      )}

      {/* Grade de favoritos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favoritos.map((imovel) => {
          const comparando = isComparando(imovel.id);
          return (
            <div
              key={imovel.id}
              className={`bg-white rounded-xl border overflow-hidden transition ${
                comparando ? "ring-2 ring-brand-goldVivid" : "hover:shadow-md"
              }`}
            >
              <div className="relative h-40 bg-gray-100">
                {imovel.fotoCapa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imovel.fotoCapa} alt={imovel.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sem foto</div>
                )}
                <span className="absolute top-2 left-2 bg-brand-dark text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                  {imovel.finalidade === "LOCACAO" ? "Aluguel" : imovel.finalidade === "VENDA_E_LOCACAO" ? "Venda e Aluguel" : "Venda"}
                </span>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleComparar(imovel.id)}
                    title={comparando ? "Remover da comparação" : "Adicionar à comparação"}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow transition ${
                      comparando ? "bg-brand-goldVivid text-white" : "bg-white/90 text-gray-500 hover:text-brand-goldVivid"
                    }`}
                  >
                    <GitCompareArrows className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removerFavorito(imovel.id)}
                    title="Remover dos favoritos"
                    className="w-7 h-7 rounded-full bg-white/90 text-red-400 hover:text-red-600 flex items-center justify-center shadow transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <span className="text-xs text-gray-400">{TIPO_LABEL[imovel.tipo] || imovel.tipo} · {imovel.codigo}</span>
                <h3 className="font-heading font-semibold text-brand-dark text-sm mt-0.5 line-clamp-2">{imovel.titulo}</h3>
                {(imovel.bairro || imovel.cidade) && (
                  <p className="text-xs text-gray-500 mt-0.5">{[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  {!!imovel.quartos && <span className="flex items-center gap-0.5"><Bed className="w-3 h-3 text-brand-goldVivid" /> {imovel.quartos}q</span>}
                  {!!imovel.vagasGaragem && <span className="flex items-center gap-0.5"><Car className="w-3 h-3 text-brand-goldVivid" /> {imovel.vagasGaragem}v</span>}
                  {!!imovel.areaTotal && <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3 text-brand-goldVivid" /> {imovel.areaTotal}m²</span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-heading font-bold text-brand-goldVivid text-sm">{formatarPreco(imovel)}</span>
                  <Link
                    href={`/imoveis/${imovel.id}`}
                    className="flex items-center gap-1 text-xs text-brand-dark hover:text-brand-goldVivid transition"
                  >
                    Ver <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de comparação */}
      {modoComparacao && imoveisComparar.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl max-w-5xl mx-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-heading text-lg font-bold text-brand-dark">Comparando imóveis</h2>
              <button onClick={() => setModoComparacao(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-gray-500 font-medium w-32">Detalhe</th>
                    {imoveisComparar.map((im) => (
                      <th key={im.id} className="p-4 text-center">
                        {im.fotoCapa && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={im.fotoCapa} alt={im.titulo} className="w-full h-28 object-cover rounded-lg mb-2" />
                        )}
                        <Link href={`/imoveis/${im.id}`} className="font-semibold text-brand-dark hover:text-brand-goldVivid line-clamp-2 text-sm">
                          {im.titulo}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-gray-500 font-medium">Preço</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center font-heading font-bold text-brand-goldVivid">{formatarPreco(im)}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-gray-500 font-medium">Tipo</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center text-brand-dark">{TIPO_LABEL[im.tipo] || im.tipo}</td>
                    ))}
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-gray-500 font-medium">Localização</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center text-brand-dark">{[im.bairro, im.cidade].filter(Boolean).join(", ") || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-gray-500 font-medium">Quartos</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center text-brand-dark">{im.quartos || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-gray-500 font-medium">Garagem</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center text-brand-dark">{im.vagasGaragem || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-gray-500 font-medium">Área</td>
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center text-brand-dark">{im.areaTotal ? `${im.areaTotal} m²` : "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4" />
                    {imoveisComparar.map((im) => (
                      <td key={im.id} className="p-4 text-center">
                        <Link
                          href={`/imoveis/${im.id}`}
                          className="inline-flex bg-brand-goldVivid text-white text-xs font-semibold rounded-md px-4 py-1.5 hover:opacity-90 transition"
                        >
                          Ver imóvel
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
