"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalSucesso from "../../_components/ModalSucesso";

type Corretor = { id: string; nome: string };
type ImovelOpcao = { id: string; titulo: string; codigo: string };

interface Props {
  corretores: Corretor[];
  imoveis: ImovelOpcao[];
  inicial?: {
    id: string;
    descricao: string | null;
    tipo: string;
    valorImovel: string | number;
    percentualComissao: string | number;
    percentualTerceiros: string | number;
    valorComissao: string | number;
    valorTerceiros: string | number;
    status: string;
    observacoes: string | null;
    imovelId: string | null;
    corretorId: string | null;
    dataVenda: Date | null;
  };
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComissaoForm({ corretores, imoveis, inicial }: Props) {
  const router = useRouter();
  const [descricao, setDescricao] = useState(inicial?.descricao || "");
  const [tipo, setTipo] = useState(inicial?.tipo || "VENDA");
  const [valorImovel, setValorImovel] = useState(String(Number(inicial?.valorImovel || 0) || ""));
  const [percentualComissao, setPercentualComissao] = useState(String(Number(inicial?.percentualComissao ?? 6)));
  const [percentualTerceiros, setPercentualTerceiros] = useState(String(Number(inicial?.percentualTerceiros ?? 30)));
  const [imovelId, setImovelId] = useState(inicial?.imovelId || "");
  const [corretorId, setCorretorId] = useState(inicial?.corretorId || "");
  const [observacoes, setObservacoes] = useState(inicial?.observacoes || "");
  const [dataVenda, setDataVenda] = useState(
    inicial?.dataVenda ? new Date(inicial.dataVenda).toISOString().split("T")[0] : ""
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const vi = Number(valorImovel) || 0;
  const pc = Number(percentualComissao) || 0;
  const pt = Number(percentualTerceiros) || 0;
  const valorComissao = (vi * pc) / 100;
  const valorTerceiros = (valorComissao * pt) / 100;

  async function salvar() {
    if (!valorImovel || vi <= 0) { setErro("Informe o valor do imóvel."); return; }
    setSalvando(true);
    setErro(null);

    const body = {
      descricao: descricao.trim() || undefined,
      tipo,
      valorImovel: vi,
      percentualComissao: pc,
      percentualTerceiros: pt,
      imovelId: imovelId || undefined,
      corretorId: corretorId || undefined,
      observacoes: observacoes.trim() || undefined,
      dataVenda: dataVenda || undefined
    };

    const url = inicial ? `/api/comissoes/${inicial.id}` : "/api/comissoes";
    const method = inicial ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    setSalvando(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErro(d.erro || "Não foi possível salvar.");
      return;
    }
    setSucesso(true);
    if (!inicial) {
      setTimeout(() => router.push("/admin/comissoes"), 1200);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-5 max-w-2xl">
      <ModalSucesso aberto={sucesso} mensagem="Comissão salva com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Venda Apt. Centro - Cliente João"
          maxLength={255}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de transação</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="VENDA">Venda</option>
            <option value="LOCACAO">Locação</option>
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data da venda/locação</label>
          <input
            type="date"
            value={dataVenda}
            onChange={(e) => setDataVenda(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Imóvel vinculado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imóvel (opcional)</label>
        <select value={imovelId} onChange={(e) => setImovelId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">— Selecione —</option>
          {imoveis.map((i) => (
            <option key={i.id} value={i.id}>{i.codigo} · {i.titulo}</option>
          ))}
        </select>
      </div>

      {/* Corretor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Corretor responsável (opcional)</label>
        <select value={corretorId} onChange={(e) => setCorretorId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">— Selecione —</option>
          {corretores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* Valores */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor do imóvel (R$)</label>
          <input
            type="number"
            value={valorImovel}
            onChange={(e) => setValorImovel(e.target.value)}
            placeholder="0,00"
            min={0}
            step={0.01}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">% Comissão imobiliária</label>
          <input
            type="number"
            value={percentualComissao}
            onChange={(e) => setPercentualComissao(e.target.value)}
            min={0}
            max={100}
            step={0.01}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">% Comissão terceiros</label>
          <input
            type="number"
            value={percentualTerceiros}
            onChange={(e) => setPercentualTerceiros(e.target.value)}
            min={0}
            max={100}
            step={0.01}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Preview calculado */}
      {vi > 0 && (
        <div className="bg-brand-light rounded-xl p-4 grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Comissão da imobiliária ({pc}%)</p>
            <p className="text-lg font-bold text-brand-dark">{fmt(valorComissao)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Comissão de terceiros ({pt}% dos {pc}%)</p>
            <p className="text-lg font-bold text-brand-goldVivid">{fmt(valorTerceiros)}</p>
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
          Voltar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
        >
          {salvando ? "Salvando..." : "Salvar comissão"}
        </button>
      </div>
    </div>
  );
}
