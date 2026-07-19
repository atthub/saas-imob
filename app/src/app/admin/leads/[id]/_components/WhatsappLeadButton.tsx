"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, ChevronRight } from "lucide-react";

type Mensagem = { id: string; titulo: string; mensagem: string; ativa: boolean };
type LeadInfo = { nome: string; telefone: string; imovelTitulo?: string | null };

function substituirVariaveis(template: string, lead: LeadInfo): string {
  return template
    .replace(/\{nome\}/g, lead.nome || "")
    .replace(/\{imovel\}/g, lead.imovelTitulo || "o imóvel")
    .replace(/\{telefone\}/g, lead.telefone || "");
}

function normalizarTelefone(tel: string): string {
  // Remove tudo exceto dígitos, adiciona 55 se não começar com +
  const digits = tel.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export default function WhatsappLeadButton({ lead }: { lead: LeadInfo }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selecionada, setSelecionada] = useState<Mensagem | null>(null);
  const [preview, setPreview] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/mensagens-whatsapp");
    const data = await res.json().catch(() => ({}));
    const ativas = (data.mensagens || []).filter((m: Mensagem) => m.ativa);
    setMensagens(ativas);
    setCarregando(false);
  }

  function abrirModal() {
    setAberto(true);
    setSelecionada(null);
    setPreview("");
    carregar();
  }

  function selecionar(m: Mensagem) {
    setSelecionada(m);
    setPreview(substituirVariaveis(m.mensagem, lead));
  }

  function enviar() {
    if (!selecionada) return;
    const telefone = normalizarTelefone(lead.telefone);
    const texto = encodeURIComponent(preview);
    window.open(`https://wa.me/${telefone}?text=${texto}`, "_blank");
    setAberto(false);
  }

  function enviarSemTemplate() {
    const telefone = normalizarTelefone(lead.telefone);
    window.open(`https://wa.me/${telefone}`, "_blank");
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={abrirModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition"
        >
          <MessageCircle size={15} />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={enviarSemTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition"
          title="Abrir WhatsApp sem mensagem pré-definida"
        >
          Abrir direto
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-green-500" />
                <h2 className="text-lg font-bold text-brand-dark">Enviar via WhatsApp</h2>
              </div>
              <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Enviar para <strong>{lead.nome}</strong> — <span className="font-mono">{lead.telefone}</span>
            </p>

            {carregando ? (
              <p className="text-sm text-gray-400">Carregando templates...</p>
            ) : mensagens.length === 0 ? (
              <div className="border border-dashed rounded-xl p-4 text-sm text-center text-gray-400 space-y-2">
                <p>Nenhum template cadastrado.</p>
                <p>Configure em <strong>Configurações → Templates WhatsApp</strong>.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Escolha um template:</p>
                {mensagens.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selecionar(m)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition ${
                      selecionada?.id === m.id
                        ? "border-green-400 bg-green-50"
                        : "hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-dark">{m.titulo}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{m.mensagem}</p>
                  </button>
                ))}
              </div>
            )}

            {selecionada && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prévia da mensagem:</p>
                <textarea
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  rows={4}
                  className="w-full border rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-green-50"
                />
                <p className="text-xs text-gray-400">Você pode editar antes de enviar.</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-1">
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
                disabled={!selecionada}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <MessageCircle size={15} />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
