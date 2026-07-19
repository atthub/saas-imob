"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

export default function SugestaoButton() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!mensagem.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.erro || "Não foi possível enviar. Tente novamente.");
        return;
      }
      setEnviado(true);
      setMensagem("");
      setTimeout(() => { setAberto(false); setEnviado(false); }, 2500);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setAberto(true); setEnviado(false); setErro(null); }}
        className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
        title="Enviar sugestão de melhoria"
      >
        <Lightbulb size={17} className="shrink-0" />
        Sugestões
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb size={20} className="text-brand-goldVivid" />
                <h2 className="text-lg font-bold text-brand-dark">Enviar sugestão</h2>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Tem alguma ideia para melhorar o sistema? Conte para a gente! Sua sugestão chega direto para a equipe.
            </p>

            {enviado ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-4 text-center">
                ✓ Sugestão enviada! Obrigado pelo feedback.
              </div>
            ) : (
              <>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={5}
                  placeholder="Descreva sua sugestão..."
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-goldVivid resize-none"
                />
                {erro && <p className="text-sm text-red-600">{erro}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={enviar}
                    disabled={enviando || mensagem.trim().length < 10}
                    className="px-4 py-2 bg-brand-goldVivid text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {enviando ? "Enviando..." : "Enviar sugestão"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
