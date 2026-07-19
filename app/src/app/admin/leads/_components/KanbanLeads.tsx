"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";

type Imovel = { id: string; titulo: string; codigo: string } | null;
type Corretor = { id: string; nome: string } | null;
type Promocao = { id: string; titulo: string } | null;

export type LeadKanban = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string | null;
  mensagem: string | null;
  observacoes: string | null;
  status: string;
  criadoEm: string; // ISO string
  imovel: Imovel;
  corretor: Corretor;
  promocao?: Promocao;
};

const COLUNAS: { status: string; label: string; cor: string; header: string }[] = [
  { status: "NOVO",           label: "Novo",           cor: "border-t-blue-500",   header: "bg-blue-50 text-blue-700" },
  { status: "DIRECIONADO",    label: "Direcionado",    cor: "border-t-amber-500",  header: "bg-amber-50 text-amber-700" },
  { status: "EM_ATENDIMENTO", label: "Em atendimento", cor: "border-t-purple-500", header: "bg-purple-50 text-purple-700" },
  { status: "CONVERTIDO",     label: "Convertido",     cor: "border-t-green-500",  header: "bg-green-50 text-green-700" },
  { status: "PERDIDO",        label: "Perdido",        cor: "border-t-gray-400",   header: "bg-gray-100 text-gray-500" },
];

export default function KanbanLeads({ leadsIniciais }: { leadsIniciais: LeadKanban[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadKanban[]>(leadsIniciais);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const obsTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Move card para nova coluna via drag & drop
  async function moverLead(leadId: string, novoStatus: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === novoStatus) return;

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: novoStatus } : l));

    await fetch(`/api/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus })
    });
  }

  // Salva observacoes com debounce de 800ms
  function salvarObs(leadId: string, valor: string) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, observacoes: valor } : l));
    clearTimeout(obsTimers.current[leadId]);
    obsTimers.current[leadId] = setTimeout(() => {
      fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacoes: valor })
      });
    }, 800);
  }

  async function excluir(leadId: string) {
    if (!confirm("Excluir este lead? Essa ação não pode ser desfeita.")) return;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    router.refresh();
  }

  function formatarData(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso));
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[70vh]">
      {COLUNAS.map((col) => {
        const cards = leads.filter((l) => l.status === col.status);
        const isOver = dragOver === col.status;

        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-t-4 bg-gray-50 shadow-sm transition-all ${col.cor} ${isOver ? "ring-2 ring-brand-gold ring-offset-1" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("leadId");
              if (id) moverLead(id, col.status);
              setDragOver(null);
            }}
          >
            {/* Header da coluna */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${col.header}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">{col.label}</span>
              <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">{cards.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
              {cards.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  Arraste um lead aqui
                </div>
              )}

              {cards.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("leadId", lead.id);
                    setArrastando(lead.id);
                  }}
                  onDragEnd={() => setArrastando(null)}
                  className={`bg-white rounded-lg border p-3 space-y-2 cursor-grab active:cursor-grabbing shadow-sm transition-all hover:shadow-md ${arrastando === lead.id ? "opacity-50 scale-95" : ""}`}
                >
                  {/* Nome + excluir */}
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-semibold text-sm text-brand-dark leading-tight">{lead.nome}</p>
                      {lead.cidade && <p className="text-xs text-gray-400">{lead.cidade}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => excluir(lead.id)}
                      className="text-gray-300 hover:text-red-400 transition shrink-0 mt-0.5"
                      title="Excluir lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Telefone */}
                  <p className="text-xs text-gray-500">{lead.telefone}</p>

                  {/* Imóvel */}
                  {lead.imovel && (
                    <div className="bg-gray-50 rounded-md px-2 py-1.5 space-y-0.5">
                      <span className="text-xs font-mono text-brand-goldVivid font-semibold">{lead.imovel.codigo}</span>
                      <p className="text-xs text-gray-600 line-clamp-1">{lead.imovel.titulo}</p>
                      <Link
                        href={`/imoveis/${lead.imovel.id}`}
                        target="_blank"
                        className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver imóvel
                      </Link>
                    </div>
                  )}

                  {/* Corretor */}
                  {lead.corretor && (
                    <p className="text-xs text-gray-400">
                      → <span className="text-gray-600">{lead.corretor.nome}</span>
                    </p>
                  )}

                  {/* Mensagem do lead */}
                  {lead.mensagem && (
                    <p className="text-xs text-gray-500 italic line-clamp-2 border-l-2 border-gray-200 pl-2">
                      "{lead.mensagem}"
                    </p>
                  )}

                  {/* Observações editáveis */}
                  <textarea
                    value={lead.observacoes || ""}
                    onChange={(e) => salvarObs(lead.id, e.target.value)}
                    placeholder="Anotações internas..."
                    rows={2}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full text-xs border border-dashed border-gray-200 rounded-md px-2 py-1.5 text-gray-600 placeholder-gray-300 resize-none focus:outline-none focus:border-brand-gold bg-yellow-50/50"
                  />

                  {/* Data/hora de cadastro */}
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <Clock className="w-3 h-3" />
                    {formatarData(lead.criadoEm)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
