"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ImovelFavorito = {
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

type FavoritosContextType = {
  favoritos: ImovelFavorito[];
  comparar: string[]; // IDs dos imóveis marcados para comparar (máx 3)
  adicionarFavorito: (imovel: ImovelFavorito) => void;
  removerFavorito: (id: string) => void;
  isFavorito: (id: string) => boolean;
  toggleFavorito: (imovel: ImovelFavorito) => void;
  toggleComparar: (id: string) => void;
  isComparando: (id: string) => boolean;
  limparComparar: () => void;
  totalFavoritos: number;
};

const FavoritosContext = createContext<FavoritosContextType | null>(null);

const STORAGE_KEY_FAV = "imob_favoritos";
const STORAGE_KEY_CMP = "imob_comparar";

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const [favoritos, setFavoritos] = useState<ImovelFavorito[]>([]);
  const [comparar, setComparar] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // Hidrata do localStorage apenas no cliente
  useEffect(() => {
    try {
      const favSalvos = localStorage.getItem(STORAGE_KEY_FAV);
      if (favSalvos) setFavoritos(JSON.parse(favSalvos));
      const cmpSalvos = localStorage.getItem(STORAGE_KEY_CMP);
      if (cmpSalvos) setComparar(JSON.parse(cmpSalvos));
    } catch {}
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(favoritos));
  }, [favoritos, hidratado]);

  useEffect(() => {
    if (!hidratado) return;
    localStorage.setItem(STORAGE_KEY_CMP, JSON.stringify(comparar));
  }, [comparar, hidratado]);

  const isFavorito = useCallback((id: string) => favoritos.some((f) => f.id === id), [favoritos]);

  const adicionarFavorito = useCallback((imovel: ImovelFavorito) => {
    setFavoritos((prev) => (prev.some((f) => f.id === imovel.id) ? prev : [...prev, imovel]));
  }, []);

  const removerFavorito = useCallback((id: string) => {
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
    setComparar((prev) => prev.filter((cid) => cid !== id));
  }, []);

  const toggleFavorito = useCallback(
    (imovel: ImovelFavorito) => {
      if (isFavorito(imovel.id)) {
        removerFavorito(imovel.id);
      } else {
        adicionarFavorito(imovel);
      }
    },
    [isFavorito, removerFavorito, adicionarFavorito]
  );

  const isComparando = useCallback((id: string) => comparar.includes(id), [comparar]);

  const toggleComparar = useCallback((id: string) => {
    setComparar((prev) => {
      if (prev.includes(id)) return prev.filter((cid) => cid !== id);
      if (prev.length >= 3) return prev; // máximo 3
      return [...prev, id];
    });
  }, []);

  const limparComparar = useCallback(() => setComparar([]), []);

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        comparar,
        adicionarFavorito,
        removerFavorito,
        isFavorito,
        toggleFavorito,
        toggleComparar,
        isComparando,
        limparComparar,
        totalFavoritos: favoritos.length
      }}
    >
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error("useFavoritos deve ser usado dentro de FavoritosProvider");
  return ctx;
}
