"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Download, ChevronDown, Columns3, Check } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ImovelResumo = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  finalidade: string;
  tipo: string;
  destaque: boolean;
  valorVenda: number | null;
  valorLocacao: number | null;
  areaTotal: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagasGaragem: number | null;
  proprietarioNome: string | null;
  criadoEm: string;
  cidade: { nome: string; uf: string } | null;
  bairro: { nome: string } | null;
  fotos: { url: string }[];
};

// ── Definição das colunas disponíveis ────────────────────────────────────────

type ColId =
  | "foto" | "codigo" | "titulo" | "tipo" | "finalidade"
  | "status" | "valor" | "area" | "quartos" | "banheiros"
  | "vagas" | "cidade" | "bairro" | "proprietario" | "destaque" | "criado";

type ColDef = {
  id: ColId;
  label: string;
  renderCelula: (imovel: ImovelResumo, extras: {
    atualizandoId: string | null;
    alternarDestaque: (imovel: ImovelResumo) => void;
    excluir: (id: string) => void;
  }) => React.ReactNode;
};

const TODAS_COLUNAS: ColDef[] = [
  {
    id: "foto",
    label: "Foto",
    renderCelula: (i) => (
      <td className="px-3 py-2">
        {i.fotos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={i.fotos[0].url} alt={i.titulo} className="w-14 h-10 object-cover rounded" />
        ) : (
          <div className="w-14 h-10 bg-gray-100 rounded" />
        )}
      </td>
    ),
  },
  {
    id: "codigo",
    label: "Código",
    renderCelula: (i) => <td className="px-3 py-2 font-medium font-mono text-xs">{i.codigo}</td>,
  },
  {
    id: "titulo",
    label: "Título",
    renderCelula: (i) => (
      <td className="px-3 py-2 max-w-[220px]">
        <span className="line-clamp-2 text-sm">{i.titulo}</span>
      </td>
    ),
  },
  {
    id: "tipo",
    label: "Tipo",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
        {TIPO_LABEL[i.tipo] || i.tipo}
      </td>
    ),
  },
  {
    id: "finalidade",
    label: "Finalidade",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
        {i.finalidade.replace("_", " / ")}
      </td>
    ),
  },
  {
    id: "status",
    label: "Status",
    renderCelula: (i) => (
      <td className="px-3 py-2">
        <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_COR[i.status] || "bg-gray-100 text-gray-500"}`}>
          {STATUS_LABEL[i.status] || i.status}
        </span>
      </td>
    ),
  },
  {
    id: "valor",
    label: "Valor",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm whitespace-nowrap">
        {i.valorVenda
          ? <span className="text-brand-dark font-medium">{formatarPreco(i.valorVenda)}</span>
          : i.valorLocacao
          ? <span className="text-blue-700">{formatarPreco(i.valorLocacao)}/mês</span>
          : <span className="text-gray-400">—</span>}
      </td>
    ),
  },
  {
    id: "area",
    label: "Área (m²)",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600">
        {i.areaTotal ? `${i.areaTotal} m²` : "—"}
      </td>
    ),
  },
  {
    id: "quartos",
    label: "Quartos",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 text-center">
        {i.quartos ?? "—"}
      </td>
    ),
  },
  {
    id: "banheiros",
    label: "Banheiros",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 text-center">
        {i.banheiros ?? "—"}
      </td>
    ),
  },
  {
    id: "vagas",
    label: "Vagas",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 text-center">
        {i.vagasGaragem ?? "—"}
      </td>
    ),
  },
  {
    id: "cidade",
    label: "Cidade",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
        {i.cidade ? `${i.cidade.nome}/${i.cidade.uf}` : "—"}
      </td>
    ),
  },
  {
    id: "bairro",
    label: "Bairro",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
        {i.bairro?.nome ?? "—"}
      </td>
    ),
  },
  {
    id: "proprietario",
    label: "Proprietário",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
        {i.proprietarioNome ?? "—"}
      </td>
    ),
  },
  {
    id: "destaque",
    label: "Destaque",
    renderCelula: (i, { atualizandoId, alternarDestaque }) => (
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => alternarDestaque(i)}
          disabled={atualizandoId === i.id}
          title={i.destaque ? "Remover destaque" : "Marcar como destaque"}
          className={`text-xl ${i.destaque ? "text-brand-goldVivid" : "text-gray-300"} hover:opacity-70 disabled:opacity-50`}
        >
          ★
        </button>
      </td>
    ),
  },
  {
    id: "criado",
    label: "Cadastrado em",
    renderCelula: (i) => (
      <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
        {new Date(i.criadoEm).toLocaleDateString("pt-BR")}
      </td>
    ),
  },
];

const COLUNAS_PADRAO: ColId[] = ["foto", "codigo", "titulo", "finalidade", "status", "destaque"];
const LS_KEY = "admin_imoveis_colunas";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível", RESERVADO: "Reservado",
  VENDIDO: "Vendido", ALUGADO: "Alugado", INATIVO: "Inativo"
};
const STATUS_COR: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-700",
  RESERVADO: "bg-yellow-100 text-yellow-700",
  VENDIDO: "bg-blue-100 text-blue-700",
  ALUGADO: "bg-purple-100 text-purple-700",
  INATIVO: "bg-gray-100 text-gray-500"
};
const TIPO_LABEL: Record<string, string> = {
  CASA: "Casa", APARTAMENTO: "Apt.", TERRENO: "Terreno",
  SALA_COMERCIAL: "Sala", GALPAO: "Galpão", CHACARA: "Chácara",
  KITNET: "Kitnet", ESPACO_FESTAS: "Espaço", OUTRO: "Outro"
};

function formatarPreco(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ImoveisListPage() {
  const [imoveis, setImoveis] = useState<ImovelResumo[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroFinalidade, setFiltroFinalidade] = useState("");
  const [filtroDestaque, setFiltroDestaque] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [visualizacao, setVisualizacao] = useState<"lista" | "grade">("lista");
  const [carregando, setCarregando] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [exportandoMenu, setExportandoMenu] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [colunasMenu, setColunasMenu] = useState(false);
  const [colunasAtivas, setColunasAtivas] = useState<ColId[]>(COLUNAS_PADRAO);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const colunasMenuRef = useRef<HTMLDivElement>(null);

  // Carregar preferências de colunas do localStorage
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(LS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo) as ColId[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setColunasAtivas(parsed);
        }
      }
    } catch { /* ignora */ }
  }, []);

  // Fechar menu de colunas ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colunasMenuRef.current && !colunasMenuRef.current.contains(e.target as Node)) {
        setColunasMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function carregar(buscaAtual = busca) {
    setCarregando(true);
    const params = new URLSearchParams();
    if (buscaAtual) params.set("busca", buscaAtual);
    if (filtroFinalidade) params.set("finalidade", filtroFinalidade);
    if (filtroDestaque) params.set("destaque", filtroDestaque);
    if (filtroStatus) params.set("status", filtroStatus);
    const resposta = await fetch(`/api/imoveis${params.toString() ? `?${params.toString()}` : ""}`);
    const data = await resposta.json();
    setImoveis(data.imoveis || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [filtroFinalidade, filtroDestaque, filtroStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBusca(valor: string) {
    setBusca(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => carregar(valor), 400);
  }

  function toggleColuna(id: ColId) {
    setColunasAtivas((prev) => {
      const novas = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      // Mantém a ordem original de TODAS_COLUNAS
      const ordenadas = TODAS_COLUNAS.map((c) => c.id).filter((c) => novas.includes(c as ColId)) as ColId[];
      localStorage.setItem(LS_KEY, JSON.stringify(ordenadas));
      return ordenadas;
    });
  }

  function resetarColunas() {
    setColunasAtivas(COLUNAS_PADRAO);
    localStorage.setItem(LS_KEY, JSON.stringify(COLUNAS_PADRAO));
  }

  async function exportarCSV(filtro: string) {
    setExportando(true);
    setExportandoMenu(false);
    const res = await fetch(`/api/imoveis/exportar?filtro=${filtro}`);
    const data = await res.json().catch(() => ({ imoveis: [] }));
    const lista = data.imoveis || [];
    if (lista.length === 0) { setExportando(false); alert("Nenhum imóvel encontrado com esse filtro."); return; }
    const cabecalho = Object.keys(lista[0]);
    const linhas = lista.map((i: Record<string, unknown>) =>
      cabecalho.map((k) => `"${String(i[k] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [cabecalho.join(","), ...linhas].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imoveis-${filtro}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
    await fetch(`/api/imoveis/${id}`, { method: "DELETE" });
    carregar();
  }

  async function alternarDestaque(imovel: ImovelResumo) {
    setAtualizandoId(imovel.id);
    try {
      await fetch(`/api/imoveis/${imovel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destaque: !imovel.destaque })
      });
      setImoveis((lista) =>
        lista.map((i) => (i.id === imovel.id ? { ...i, destaque: !i.destaque } : i))
      );
    } finally {
      setAtualizandoId(null);
    }
  }

  // Colunas visíveis na ordem de TODAS_COLUNAS
  const colunasVisiveis = TODAS_COLUNAS.filter((c) => colunasAtivas.includes(c.id));
  // A coluna de ações é sempre a última
  const extrasProps = { atualizandoId, alternarDestaque, excluir };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Imóveis</h1>
        <div className="flex items-center gap-2">
          {/* Exportar CSV */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportandoMenu((v) => !v)}
              disabled={exportando}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={15} />
              {exportando ? "Exportando..." : "Exportar CSV"}
              <ChevronDown size={13} />
            </button>
            {exportandoMenu && (
              <div className="absolute right-0 mt-1 bg-white border rounded-xl shadow-lg z-20 min-w-[180px] overflow-hidden">
                {[
                  { filtro: "todos", label: "Todos os imóveis" },
                  { filtro: "ativos", label: "Somente ativos" },
                  { filtro: "inativos", label: "Somente inativos" },
                  { filtro: "destaque", label: "Somente destaque" }
                ].map((op) => (
                  <button key={op.filtro} type="button" onClick={() => exportarCSV(op.filtro)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    {op.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/admin/imoveis/novo"
            className="bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90">
            + Novo imóvel
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          placeholder="Buscar por título ou código..."
          className="flex-1 min-w-[180px] border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          <option value="DISPONIVEL">Disponível</option>
          <option value="RESERVADO">Reservado</option>
          <option value="VENDIDO">Vendido</option>
          <option value="ALUGADO">Alugado</option>
          <option value="INATIVO">Inativo</option>
        </select>
        <select value={filtroFinalidade} onChange={(e) => setFiltroFinalidade(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">Venda e locação</option>
          <option value="VENDA">Somente venda</option>
          <option value="LOCACAO">Somente locação</option>
        </select>
        <select value={filtroDestaque} onChange={(e) => setFiltroDestaque(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">Destaque e não destaque</option>
          <option value="true">Somente destaque</option>
          <option value="false">Somente não destaque</option>
        </select>

        <div className="flex gap-1 ml-auto">
          {/* Seletor de colunas */}
          {visualizacao === "lista" && (
            <div className="relative" ref={colunasMenuRef}>
              <button
                type="button"
                onClick={() => setColunasMenu((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm transition
                  ${colunasMenu ? "border-brand-goldVivid text-brand-goldVivid bg-amber-50" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
              >
                <Columns3 size={15} />
                Colunas
                <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {colunasAtivas.length}
                </span>
              </button>

              {colunasMenu && (
                <div className="absolute right-0 mt-1 bg-white border rounded-xl shadow-lg z-30 w-56 overflow-hidden">
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colunas visíveis</span>
                    <button onClick={resetarColunas} className="text-xs text-brand-goldVivid hover:underline">Padrão</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {TODAS_COLUNAS.map((col) => {
                      const ativo = colunasAtivas.includes(col.id);
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => toggleColuna(col.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${ativo ? "bg-brand-goldVivid border-brand-goldVivid" : "border-gray-300"}`}>
                            {ativo && <Check size={11} className="text-white" />}
                          </span>
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle grade/lista */}
          <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden">
            <button type="button" onClick={() => setVisualizacao("lista")} title="Visualização em lista"
              className={`p-2 transition ${visualizacao === "lista" ? "bg-brand-dark text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              <List size={16} />
            </button>
            <button type="button" onClick={() => setVisualizacao("grade")} title="Visualização em grade"
              className={`p-2 transition ${visualizacao === "grade" ? "bg-brand-dark text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Visualização lista com colunas dinâmicas */}
      {visualizacao === "lista" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
              <tr>
                {colunasVisiveis.map((col) => (
                  <th key={col.id} className="px-3 py-3">{col.label}</th>
                ))}
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={colunasVisiveis.length + 1} className="px-4 py-6 text-center text-gray-400">Carregando...</td></tr>
              )}
              {!carregando && imoveis.length === 0 && (
                <tr><td colSpan={colunasVisiveis.length + 1} className="px-4 py-6 text-center text-gray-400">Nenhum imóvel encontrado.</td></tr>
              )}
              {imoveis.map((imovel) => (
                <tr key={imovel.id} className="border-t hover:bg-gray-50 transition">
                  {colunasVisiveis.map((col) => col.renderCelula(imovel, extrasProps))}
                  {/* Ações sempre visíveis */}
                  <td className="px-3 py-2 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/imoveis/${imovel.id}/editar`} className="text-brand-goldVivid hover:underline text-xs">Editar</Link>
                    <a href={`/imoveis/${imovel.id}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-brand-dark text-xs">Ver</a>
                    <button onClick={() => excluir(imovel.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização grade (sem alteração) */}
      {visualizacao === "grade" && (
        <div>
          {carregando && <p className="text-sm text-gray-400 py-6 text-center">Carregando...</p>}
          {!carregando && imoveis.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">Nenhum imóvel encontrado.</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {imoveis.map((imovel) => (
              <div key={imovel.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                {imovel.fotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imovel.fotos[0].url} alt={imovel.titulo} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sem foto</div>
                )}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs text-gray-400 font-mono">{imovel.codigo}</span>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_COR[imovel.status] || "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[imovel.status] || imovel.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-brand-dark line-clamp-2 flex-1">{imovel.titulo}</p>
                  {imovel.cidade && (
                    <p className="text-xs text-gray-400">{imovel.cidade.nome}/{imovel.cidade.uf}</p>
                  )}
                  {(imovel.valorVenda || imovel.valorLocacao) && (
                    <p className="text-sm font-bold text-brand-dark">
                      {imovel.valorVenda ? formatarPreco(imovel.valorVenda) : `${formatarPreco(imovel.valorLocacao!)}/mês`}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button onClick={() => alternarDestaque(imovel)} disabled={atualizandoId === imovel.id}
                      title={imovel.destaque ? "Remover destaque" : "Marcar como destaque"}
                      className={`text-xl ${imovel.destaque ? "text-brand-goldVivid" : "text-gray-300"} hover:opacity-70 disabled:opacity-50`}>
                      ★
                    </button>
                    <div className="flex gap-2 text-xs">
                      <Link href={`/admin/imoveis/${imovel.id}/editar`} className="text-brand-goldVivid">Editar</Link>
                      <a href={`/imoveis/${imovel.id}`} target="_blank" rel="noreferrer" className="text-gray-500">Ver</a>
                      <button onClick={() => excluir(imovel.id)} className="text-red-600">Excluir</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
