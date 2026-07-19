"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type ImovelAtual = { codigo: string; titulo: string } | null;

type WhatsappContextValue = {
  imovelAtual: ImovelAtual;
  registrarImovel: (imovel: ImovelAtual) => void;
};

const WhatsappContext = createContext<WhatsappContextValue | null>(null);

export function WhatsappProvider({ children }: { children: React.ReactNode }) {
  const [imovelAtual, setImovelAtual] = useState<ImovelAtual>(null);

  const registrarImovel = useCallback((imovel: ImovelAtual) => {
    setImovelAtual(imovel);
  }, []);

  const value = useMemo(() => ({ imovelAtual, registrarImovel }), [imovelAtual, registrarImovel]);

  return <WhatsappContext.Provider value={value}>{children}</WhatsappContext.Provider>;
}

export function useWhatsappContext() {
  const ctx = useContext(WhatsappContext);
  if (!ctx) throw new Error("useWhatsappContext deve ser usado dentro de WhatsappProvider");
  return ctx;
}
