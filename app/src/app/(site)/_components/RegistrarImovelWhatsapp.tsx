"use client";

import { useEffect } from "react";
import { useWhatsappContext } from "./WhatsappContext";

// Componente invisível: ao montar na página de detalhe de um imóvel,
// registra código + título no contexto do WhatsApp flutuante, para que a
// mensagem pré-preenchida do botão mencione esse imóvel específico. Ao saiR
// da página (desmontar), limpa o registro.
export default function RegistrarImovelWhatsapp({ codigo, titulo }: { codigo: string; titulo: string }) {
  const { registrarImovel } = useWhatsappContext();

  useEffect(() => {
    registrarImovel({ codigo, titulo });
    return () => registrarImovel(null);
  }, [codigo, titulo, registrarImovel]);

  return null;
}
