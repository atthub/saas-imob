"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { iconeBotaoWhatsapp } from "@/lib/icones";
import { useWhatsappContext } from "./WhatsappContext";

type Props = {
  numero: string;
  mensagemFlutuante: string;
  posicao: string;
  icone: string;
};

function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, "");
}

export default function WhatsappBotao({ numero, mensagemFlutuante, posicao, icone }: Props) {
  const { imovelAtual } = useWhatsappContext();
  const [balaoFechado, setBalaoFechado] = useState(false);

  const digitos = somenteDigitos(numero);
  if (!digitos) return null;

  const numeroComPais = digitos.startsWith("55") ? digitos : `55${digitos}`;

  const mensagemEnvio = imovelAtual
    ? `Olá! Estou interessado no imóvel ${imovelAtual.codigo} - ${imovelAtual.titulo}.`
    : "Olá! Vim pelo site e gostaria de mais informações.";

  const link = `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagemEnvio)}`;

  const Icone = iconeBotaoWhatsapp(icone);
  const ladoClasse = posicao === "bottom-left" ? "left-5" : "right-5";

  return (
    <div className={`fixed bottom-5 ${ladoClasse} z-40 flex flex-col items-end gap-2`}>
      {!balaoFechado && mensagemFlutuante && (
        <div
          className={`relative bg-white shadow-lg rounded-xl px-4 py-3 text-sm text-brand-dark max-w-[240px] ${
            posicao === "bottom-left" ? "self-start" : "self-end"
          }`}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setBalaoFechado(true)}
            className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {mensagemFlutuante}
        </div>
      )}

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar no WhatsApp"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <Icone className="w-7 h-7" />
      </a>
    </div>
  );
}
