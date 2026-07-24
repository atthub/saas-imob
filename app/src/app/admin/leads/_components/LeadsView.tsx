"use client";

import { useEffect, useState } from "react";
import { LayoutList, KanbanSquare, Download } from "lucide-react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import DirecionarLeadSelect from "./DirecionarLeadSelect";
import ExcluirLeadButton from "./ExcluirLeadButton";
import KanbanLeads, { type LeadKanban } from "./KanbanLeads";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  DIRECIONADO: "Direcionado",
  EM_ATENDIMENTO: "Em atendimento",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido"
};

const STATUS_COR: Record<string, string> = {
  NOVO: "bg-blue-50 text-blue-700",
  DIRECIONADO: "bg-amber-50 text-amber-700",
  EM_ATENDIMENTO: "bg-purple-50 text-purple-700",
  CONVERTIDO: "bg-green-50 text-green-700",
  PERDIDO: "bg-gray-100 text-gray-500"
};

type Corretor = { id: string; nome: string };
type Promocao = { id: string; titulo: string };

export default function LeadsView({
  leads,
  corretores,
  modoCorretor = false
}: {
  leads: LeadKanban[];
  corretores: Corretor[];
  modoCorretor?: boolean;
}) {
  const [modo, setModo] = useState<"lista" | "kanban">("lista");

  useEffect(() => {
    const salvo = localStorage.getItem("leads-modo-view");
    if (salvo === "kanban" || salvo === "lista") setModo(salvo);
  }, []);

  function alternarModo(novoModo: "lista" | "kanban") {
    setModo(novoModo);
    localStorage.setItem("leads-modo-view", novoModo);
  }

  function formatarData(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso));
  }

  function exportarCSV() {
    const cabecalho = ["Nome", "Telefone", "Cidade", "Status", "Imóvel", "Corretor", "Mensagem", "Data"];
    const linhas = leads.map((l) => [
      l.nome,
      l.telefone,
      l.cidade || "",
      STATUS_LABEL[l.status] || l.status,
      l.imovel ? `${l.imovel.codigo} - ${l.imovel.titulo}` : "",
      l.corretor?.nome || "",
      (l.mensagem || "").replace(/\n/g, " "),
      formatarData(l.criadoEm)
    ]);
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Toggle Lista / Kanban + Exportar */}
      <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => alternarModo("lista")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            modo === "lista"
              ? "bg-white shadow text-brand-dark"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Lista
        </button>
        <button
          type="button"
          onClick={() => alternarModo("kanban")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            modo === "kanban"
              ? "bg-white shadow text-brand-dark"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          Kanban
        </button>
      </div>
        <button
          type="button"
          onClick={exportarCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Visão Lista */}
      {modo === "lista" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    Nenhum lead recebido ainda.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-dark">{lead.nome}</div>
                    {lead.cidade && <div className="text-xs text-gray-400">{lead.cidade}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.telefone}</td>
                  <td className="px-4 py-3">
                    {lead.imovel ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono text-brand-goldVivid font-semibold">{lead.imovel.codigo}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">{lead.imovel.titulo}</div>
                        <Link
                          href={`/imoveis/${lead.imovel.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700 transition"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver imóvel
                        </Link>
                      </div>
                    ) : (lead as any).promocao ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          📣 Promoção
                        </span>
                        <div className="text-xs text-gray-600 line-clamp-1">{(lead as any).promocao.titulo}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Contato geral</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2 py-1 ${STATUS_COR[lead.status]}`}>
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {lead.corretor ? lead.corretor.nome : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatarData(lead.criadoEm)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-xs text-gray-500 hover:text-brand-dark underline"
                      >
                        Detalhes
                      </Link>
                      {!modoCorretor && (
                        <>
                          <DirecionarLeadSelect
                            leadId={lead.id}
                            corretores={corretores}
                            corretorAtualId={lead.corretor?.id || null}
                          />
                          <ExcluirLeadButton leadId={lead.id} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visão Kanban */}
      {modo === "kanban" && (
        <KanbanLeads leadsIniciais={leads} />
      )}
    </div>
  );
}
