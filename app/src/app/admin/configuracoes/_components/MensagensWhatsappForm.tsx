"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

type Mensagem = {
  id: string;
  titulo: string;
  mensagem: string;
  ativa: boolean;
};

export default function MensagensWhatsappForm() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [formTitulo, setFormTitulo] = useState("");
  const [formMensagem, setFormMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/mensagens-whatsapp");
    const data = await res.json().catch(() => ({}));
    setMensagens(data.mensagens || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function adicionar() {
    if (!formTitulo.trim() || !formMensagem.trim()) return;
    setSalvando(true);
    setErro(null);
    const res = await fetch("/api/mensagens-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: formTitulo, mensagem: formMensagem })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErro(data.erro || "Erro ao salvar."); setSalvando(false); return; }
    setFormTitulo("");
    setFormMensagem("");
    setAdicionando(false);
    setSalvando(false);
    carregar();
  }

  function iniciarEdicao(m: Mensagem) {
    setEditandoId(m.id);
    setNovoTitulo(m.titulo);
    setNovaMensagem(m.mensagem);
  }

  async function salvarEdicao(id: string) {
    setSalvando(true);
    const res = await fetch(`/api/mensagens-whatsapp/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: novoTitulo, mensagem: novaMensagem })
    });
    if (res.ok) { setEditandoId(null); carregar(); }
    setSalvando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este template?")) return;
    await fetch(`/api/mensagens-whatsapp/${id}`, { method: "DELETE" });
    carregar();
  }

  async function alternarAtiva(m: Mensagem) {
    await fetch(`/api/mensagens-whatsapp/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !m.ativa })
    });
    carregar();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-brand-dark mb-1">Templates de mensagem WhatsApp</h2>
        <p className="text-sm text-gray-500">
          Crie mensagens pré-definidas para envio via WhatsApp. Use{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">{"{nome}"}</code>,{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">{"{imovel}"}</code> e{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">{"{telefone}"}</code> como variáveis.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {mensagens.length === 0 && !adicionando && (
            <p className="text-sm text-gray-400 text-center py-6 border border-dashed rounded-xl">
              Nenhum template cadastrado ainda.
            </p>
          )}

          {mensagens.map((m) => (
            <div key={m.id} className={`border rounded-xl p-4 space-y-2 ${m.ativa ? "bg-white" : "bg-gray-50 opacity-60"}`}>
              {editandoId === m.id ? (
                <div className="space-y-2">
                  <input
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Título do template"
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-goldVivid"
                  />
                  <textarea
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    rows={4}
                    placeholder="Texto da mensagem..."
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-goldVivid resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => salvarEdicao(m.id)}
                      disabled={salvando}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-goldVivid text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={14} /> Salvar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{m.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{m.mensagem}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => alternarAtiva(m)}
                        title={m.ativa ? "Desativar" : "Ativar"}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${m.ativa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {m.ativa ? "Ativo" : "Inativo"}
                      </button>
                      <button
                        onClick={() => iniciarEdicao(m)}
                        className="p-1.5 text-gray-400 hover:text-brand-goldVivid"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => excluir(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {adicionando ? (
            <div className="border rounded-xl p-4 space-y-2 bg-white">
              <input
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Título do template (ex: Interesse em imóvel)"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-goldVivid"
              />
              <textarea
                value={formMensagem}
                onChange={(e) => setFormMensagem(e.target.value)}
                rows={5}
                placeholder={"Olá {nome}, vi que você tem interesse no imóvel {imovel}. Posso te ajudar?"}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-goldVivid resize-none"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-2">
                <button
                  onClick={adicionar}
                  disabled={salvando || !formTitulo.trim() || !formMensagem.trim()}
                  className="flex items-center gap-1 px-4 py-2 bg-brand-goldVivid text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={14} /> Salvar template
                </button>
                <button
                  onClick={() => { setAdicionando(false); setFormTitulo(""); setFormMensagem(""); setErro(null); }}
                  className="px-4 py-2 border text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdicionando(true)}
              className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-brand-goldVivid hover:text-brand-goldVivid transition justify-center"
            >
              <Plus size={16} /> Adicionar template
            </button>
          )}
        </div>
      )}
    </div>
  );
}
