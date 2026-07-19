"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  aberto: boolean;
  mensagem?: string;
  onClose: () => void;
  duracaoMs?: number;
};

// Quadro central de confirmação exibido depois que um cadastro é salvo com
// sucesso. Some automaticamente após `duracaoMs`, mas também pode ser
// fechado clicando fora do quadro ou no botão "OK".
export default function ModalSucesso({
  aberto,
  mensagem = "Salvo com sucesso!",
  onClose,
  duracaoMs = 2000
}: Props) {
  useEffect(() => {
    if (!aberto) return;
    const timer = setTimeout(onClose, duracaoMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, duracaoMs]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center gap-3 max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckCircle2 size={40} className="text-green-500" />
        <p className="font-semibold text-brand-dark">{mensagem}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-brand-goldVivid font-medium hover:underline mt-1"
        >
          OK
        </button>
      </div>
    </div>
  );
}
