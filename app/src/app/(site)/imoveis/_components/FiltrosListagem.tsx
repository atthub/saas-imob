"use client";

import { useState, useCallback, useRef } from "react";
import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatarPreco(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
}

/** Converte texto digitado em número (aceita "250000", "250.000", "250k", "1.5M") */
function parsearTexto(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, "").toUpperCase();
  if (!limpo) return null;
  const comMultiplicador = limpo.match(/^R?\$?\s*([\d.,]+)\s*([KMB]?)$/);
  if (!comMultiplicador) return null;
  const num = parseFloat(comMultiplicador[1].replace(/\./g, "").replace(",", "."));
  if (isNaN(num)) return null;
  const mult = comMultiplicador[2];
  if (mult === "K") return Math.round(num * 1_000);
  if (mult === "M") return Math.round(num * 1_000_000);
  return Math.round(num);
}

/** Formata número para exibição no input de texto */
function formatarInput(v: number): string {
  return v.toLocaleString("pt-BR");
}

// ── Componente de input de preço ──────────────────────────────────────────────

function InputPreco({
  label,
  valor,
  min,
  max,
  onChange,
  onCommit,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  const [texto, setTexto] = useState<string | null>(null); // null = usar valor formatado
  const inputRef = useRef<HTMLInputElement>(null);

  const valorExibido = texto !== null ? texto : formatarInput(valor);

  function aoFocar() {
    // Ao focar: mostra o número puro para facilitar edição
    setTexto(valor > 0 ? String(valor) : "");
  }

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    // Permite digitar livremente — só aceita dígitos, pontos e vírgulas
    const v = e.target.value.replace(/[^\d.,kKmMbB]/g, "");
    setTexto(v);
  }

  function aoSair() {
    const parsed = texto !== null ? parsearTexto(texto) : null;
    if (parsed !== null && !isNaN(parsed)) {
      const clampado = Math.max(min, Math.min(max, parsed));
      onChange(clampado);
      setTexto(null);
      onCommit();
    } else {
      // Texto inválido: restaura valor anterior
      setTexto(null);
    }
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setTexto(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">R$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={valorExibido}
          onFocus={aoFocar}
          onChange={aoDigitar}
          onBlur={aoSair}
          onKeyDown={aoTeclar}
          placeholder="0"
          className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
        />
        {valor > (label === "De" ? 0 : max) || (label === "Até" && valor < max) ? null : null}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  finalidadeInicial?: string;
  tipoInicial?: string;
  buscaInicial?: string;
  precoMinInicial?: number;
  precoMaxInicial?: number;
  ordenacaoInicial?: string;
  precoMaxAbsoluto?: number;
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function FiltrosListagem({
  finalidadeInicial = "",
  tipoInicial = "",
  buscaInicial = "",
  precoMinInicial = 0,
  precoMaxInicial,
  ordenacaoInicial = "recentes",
  precoMaxAbsoluto = 5_000_000,
}: Props) {
  const precoMaxPadrao = precoMaxAbsoluto;
  const [finalidade, setFinalidade] = useState(finalidadeInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [busca, setBusca] = useState(buscaInicial);
  const [precoMin, setPrecoMin] = useState(precoMinInicial);
  const [precoMax, setPrecoMax] = useState(precoMaxInicial ?? precoMaxPadrao);
  const [ordenacao, setOrdenacao] = useState(ordenacaoInicial);
  const [mostrarFiltrosPreco, setMostrarFiltrosPreco] = useState(
    precoMinInicial > 0 || (precoMaxInicial !== undefined && precoMaxInicial < precoMaxPadrao)
  );

  const navegar = useCallback(
    (overrides: Partial<{
      finalidade: string; tipo: string; busca: string;
      precoMin: number; precoMax: number; ordenacao: string;
    }> = {}) => {
      const f = overrides.finalidade ?? finalidade;
      const t = overrides.tipo ?? tipo;
      const b = overrides.busca ?? busca;
      const pMin = overrides.precoMin ?? precoMin;
      const pMax = overrides.precoMax ?? precoMax;
      const ord = overrides.ordenacao ?? ordenacao;

      const params = new URLSearchParams();
      if (f) params.set("finalidade", f);
      if (t) params.set("tipo", t);
      if (b) params.set("busca", b);
      if (pMin > 0) params.set("precoMin", String(pMin));
      if (pMax < precoMaxPadrao) params.set("precoMax", String(pMax));
      if (ord && ord !== "recentes") params.set("ordenacao", ord);
      window.location.href = `/imoveis?${params.toString()}`;
    },
    [finalidade, tipo, busca, precoMin, precoMax, ordenacao, precoMaxPadrao]
  );

  function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    navegar();
  }

  function limparFiltrosPreco() {
    setPrecoMin(0);
    setPrecoMax(precoMaxPadrao);
    navegar({ precoMin: 0, precoMax: precoMaxPadrao });
  }

  const filtroPrecoAtivo = precoMin > 0 || precoMax < precoMaxPadrao;
  const percMin = (precoMin / precoMaxPadrao) * 100;
  const percMax = (precoMax / precoMaxPadrao) * 100;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-8 shadow-sm space-y-4">

      {/* Linha 1: busca principal */}
      <form onSubmit={aoSubmeter} className="flex flex-col sm:flex-row gap-3">
        <select
          value={finalidade}
          onChange={(e) => { setFinalidade(e.target.value); navegar({ finalidade: e.target.value }); }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
        >
          <option value="">Comprar ou alugar</option>
          <option value="VENDA">Comprar</option>
          <option value="LOCACAO">Alugar</option>
        </select>

        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value); navegar({ tipo: e.target.value }); }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
        >
          <option value="">Todos os tipos</option>
          <option value="CASA">Casa</option>
          <option value="APARTAMENTO">Apartamento</option>
          <option value="TERRENO">Terreno</option>
          <option value="SALA_COMERCIAL">Sala comercial</option>
          <option value="GALPAO">Galpão</option>
          <option value="CHACARA">Chácara</option>
          <option value="KITNET">Kitnet</option>
          <option value="ESPACO_FESTAS">Espaço para festas</option>
          <option value="OUTRO">Outro</option>
        </select>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Bairro, cidade ou código"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />

        <button
          type="submit"
          className="bg-brand-goldVivid text-white font-semibold rounded-lg px-5 py-2.5 text-sm hover:opacity-90 transition flex items-center gap-1.5 justify-center shrink-0"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </form>

      {/* Linha 2: filtros de preço + ordenação */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center border-t border-gray-100 pt-4">

        {/* Botão para expandir/recolher filtro de preço */}
        <button
          type="button"
          onClick={() => setMostrarFiltrosPreco((v) => !v)}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition shrink-0 ${
            filtroPrecoAtivo
              ? "border-brand-goldVivid text-brand-goldVivid bg-amber-50"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Faixa de preço
          {filtroPrecoAtivo && (
            <span className="ml-1 text-xs bg-brand-goldVivid text-white rounded-full px-1.5 py-0.5 leading-none">
              {formatarPreco(precoMin)} – {formatarPreco(precoMax)}
            </span>
          )}
          {filtroPrecoAtivo ? (
            <X
              className="w-3.5 h-3.5 ml-1 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); limparFiltrosPreco(); }}
            />
          ) : (
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarFiltrosPreco ? "rotate-180" : ""}`} />
          )}
        </button>

        {/* Ordenação */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <label className="text-sm text-gray-500 shrink-0">Ordenar:</label>
          <div className="relative">
            <select
              value={ordenacao}
              onChange={(e) => { setOrdenacao(e.target.value); navegar({ ordenacao: e.target.value }); }}
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer bg-white"
            >
              <option value="recentes">Mais recentes</option>
              <option value="menor_preco">Menor valor</option>
              <option value="maior_preco">Maior valor</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Painel de filtro de preço (expandível) */}
      {mostrarFiltrosPreco && (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-4">
          {/* Inputs de texto */}
          <div className="grid grid-cols-2 gap-3">
            <InputPreco
              label="De"
              valor={precoMin}
              min={0}
              max={precoMax - 1}
              onChange={setPrecoMin}
              onCommit={() => navegar()}
            />
            <InputPreco
              label="Até"
              valor={precoMax}
              min={precoMin + 1}
              max={precoMaxPadrao}
              onChange={setPrecoMax}
              onCommit={() => navegar()}
            />
          </div>

          {/* Slider mínimo */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Valor mínimo</span>
              <span className="font-medium text-brand-dark">{formatarPreco(precoMin)}</span>
            </div>
            <div className="relative h-8 flex items-center">
              {/* Track */}
              <div className="absolute inset-x-0 h-2 bg-gray-200 rounded-full" />
              <div
                className="absolute h-2 bg-brand-gold/40 rounded-full"
                style={{ left: 0, right: `${100 - percMin}%` }}
              />
              <input
                type="range"
                min={0}
                max={precoMaxPadrao}
                step={Math.max(10_000, Math.round(precoMaxPadrao / 100))}
                value={precoMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v < precoMax) setPrecoMin(v);
                }}
                onMouseUp={() => navegar()}
                onTouchEnd={() => navegar()}
                className="relative w-full h-2 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-brand-goldVivid
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-brand-goldVivid
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-none"
              />
            </div>
          </div>

          {/* Slider máximo */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Valor máximo</span>
              <span className="font-medium text-brand-dark">
                {precoMax >= precoMaxPadrao ? `até ${formatarPreco(precoMaxPadrao)}` : formatarPreco(precoMax)}
              </span>
            </div>
            <div className="relative h-8 flex items-center">
              {/* Track */}
              <div className="absolute inset-x-0 h-2 bg-gray-200 rounded-full" />
              <div
                className="absolute h-2 bg-brand-goldVivid rounded-full"
                style={{ left: `${percMin}%`, right: `${100 - percMax}%` }}
              />
              <input
                type="range"
                min={0}
                max={precoMaxPadrao}
                step={Math.max(10_000, Math.round(precoMaxPadrao / 100))}
                value={precoMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > precoMin) setPrecoMax(v);
                }}
                onMouseUp={() => navegar()}
                onTouchEnd={() => navegar()}
                className="relative w-full h-2 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-brand-goldVivid
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-brand-goldVivid
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-none"
              />
            </div>
          </div>

          {/* Resumo e botão aplicar */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-500">
              Exibindo imóveis de <strong>{formatarPreco(precoMin)}</strong> até{" "}
              <strong>{precoMax >= precoMaxPadrao ? "qualquer valor" : formatarPreco(precoMax)}</strong>
            </p>
            <button
              type="button"
              onClick={() => navegar()}
              className="text-xs bg-brand-goldVivid text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
