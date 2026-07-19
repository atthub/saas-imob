"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Phone, Send, CalendarCheck, CheckCircle, Trash2 } from "lucide-react";

type Interacao = {
  id: string;
  tipo: string;
  descricao: string;
  usuarioNome: string | null;
  criadoEm: string;
  dataAgendada: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  NOTA: "Nota",
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  VISITA_AGENDADA: "Visita agendada",
  VISITA_REALIZADA: "Visita realizada"
};

const TIPO_ICONE: Record<string, React.ReactNode> = {
  NOTA: <MessageSquare size={14} />,
  LIGACAO: <Phone size={14} />,
  WHATSAPP: <Send size={14} />,
  VISITA_AGENDADA: <CalendarCheck size={14} />,
  VISITA_REALIZADA: <CheckCircle size={14} />
};

const TIPO_COR: Record<string, string> = {
  NOTA: "bg-gray-100 text-gray-600",
  LIGACAO: "bg-blue-100 text-blue-700",
  WHATSAPP: "bg-green-100 text-green-700",
  VISITA_AGENDADA: "bg-amber-100 text-amber-700",
  VISITA_REALIZADA: "bg-purple-100 text-purple-700"
};

export default function LeadInteracoes({
  leadId,
  interacoesIniciais
}: {
  leadId: string;
  interacoesIniciais: Interacao[];
}) {
  const [interacoes, setInteracoes] = useState<Interacao[]>(interacoesIniciais);

  useEffect(() => {
    fetch(`/api/leads/interacoes?leadId=${leadId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.interacoes)) setInteracoes(data.interacoes); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);
  const [tipo, setTipo] = useState("NOTA");
  const [descricao, setDescricao] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar() {
    if (!descricao.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/leads/interacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, tipo, descricao, dataAgendada: dataAgendada || null })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErro(data.erro || "Erro ao registrar."); return; }
      setInteracoes([{ ...data.interacao, criadoEm: data.interacao.criadoEm }, ...interacoes]);
      setDescricao("");
      setDataAgendada("");
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este registro?")) return;
    await fetch(`/api/leads/interacoes/${id}`, { method: "DELETE" });
    setInteracoes((prev) => prev.filter((i) => i.id !== id));
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <h2 className="font-semibold text-brand-dark">Histórico de interações</h2>

      {/* Formulário */}
      <div className="space-y-2 border-b pb-4">
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldVivid"
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(tipo === "VISITA_AGENDADA") && (
            <input
              type="datetime-local"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldVivid flex-1"
            />
          )}
        </div>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o que aconteceu..."
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldVivid resize-none"
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="button"
          onClick={registrar}
          disabled={salvando || !descricao.trim()}
          className="w-full py-2 bg-brand-goldVivid text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Registrando..." : "Registrar"}
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {interacoes.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma interação registrada.</p>
        )}
        {interacoes.map((i) => (
          <div key={i.id} className="flex gap-3">
            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${TIPO_COR[i.tipo] || "bg-gray-100 text-gray-500"}`}>
              {TIPO_ICONE[i.tipo] || <MessageSquare size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-brand-dark">{TIPO_LABEL[i.tipo] || i.tipo}</span>
                  {i.dataAgendada && (
                    <span className="ml-2 text-xs text-amber-600">📅 {fmt(i.dataAgendada)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => excluir(i.id)}
                  className="text-gray-300 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{i.descricao}</p>
              <p className="text-xs text-gray-400 mt-1">
                {i.usuarioNome && `${i.usuarioNome} · `}{fmt(i.criadoEm)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
