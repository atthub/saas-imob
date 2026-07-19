"use client";

import { useState, useCallback } from "react";
import { Calculator, Home, Info, ChevronDown, ChevronUp } from "lucide-react";

// ── Dados oficiais: Portaria MCID nº 333, 01/04/2026 ─────────────────────────
//
// Faixa 1 urbana  → renda familiar bruta até R$ 3.200/mês
// Faixa 2 urbana  → R$ 3.200,01 até R$ 5.000/mês
// Faixa 3 urbana  → R$ 5.000,01 até R$ 9.600/mês
// Faixa 4 urbana  → R$ 9.600,01 até R$ 13.000/mês  (Classe Média – criada em 2025)
//
// Valor máximo do imóvel (por faixa / localidade):
//   Faixas 1–2: R$ 190k (municípios pequenos) até R$ 275k (SP, RJ, DF e capitais de 1ª linha)
//   Faixa 3:    R$ 350.000 a R$ 400.000
//   Faixa 4:    R$ 500.000 a R$ 600.000
//
// Taxas de juros efetivas a.a. (referência Portaria MCID nº 333):
//   Faixa 1:  isenção de juros / subsidiada (depende de subprograma)
//             Para o simulador, usamos taxa operacional de 4,5% a.a. (cotistas FGTS SP/RJ)
//   Faixa 2:  4,75% – 6,50% a.a. (conforme localidade e composição familiar)
//   Faixa 3:  7,66% – 8,16% a.a. (conforme localidade)
//   Faixa 4 (Classe Média): 10,00% a.a. (sem subsídio)
//
// Prazo máximo financiamento: 360 meses (30 anos) – Faixas 1, 2 e 3
//                              240 meses (20 anos) – Faixa 4
// Entrada mínima: 20% do valor do imóvel (regra geral FGTS/SBPE)
// Subsídio estimado Faixa 1–2: até R$ 55.000 (conforme renda e localidade)

interface Faixa {
  id: string;
  label: string;
  rendaMax: number;       // R$/mês
  rendaMin: number;
  taxaJuros: number;      // % a.a.
  valorMaxImovel: number; // R$
  prazoMaxMeses: number;
  subsidioMax: number;    // R$ (estimativa)
  descricao: string;
  cor: string;
}

const FAIXAS: Faixa[] = [
  {
    id: "faixa1",
    label: "Faixa 1",
    rendaMin: 0,
    rendaMax: 3200,
    taxaJuros: 4.75,
    valorMaxImovel: 210000,
    prazoMaxMeses: 360,
    subsidioMax: 55000,
    descricao: "Renda familiar bruta até R$ 3.200/mês. Maior subsídio do programa.",
    cor: "bg-green-100 border-green-500 text-green-800",
  },
  {
    id: "faixa2",
    label: "Faixa 2",
    rendaMin: 3200.01,
    rendaMax: 5000,
    taxaJuros: 6.5,
    valorMaxImovel: 275000,
    prazoMaxMeses: 360,
    subsidioMax: 29000,
    descricao: "Renda familiar bruta de R$ 3.200,01 até R$ 5.000/mês.",
    cor: "bg-blue-100 border-blue-500 text-blue-800",
  },
  {
    id: "faixa3",
    label: "Faixa 3",
    rendaMin: 5000.01,
    rendaMax: 9600,
    taxaJuros: 8.16,
    valorMaxImovel: 400000,
    prazoMaxMeses: 360,
    subsidioMax: 0,
    descricao: "Renda familiar bruta de R$ 5.000,01 até R$ 9.600/mês. Sem subsídio direto.",
    cor: "bg-yellow-100 border-yellow-500 text-yellow-800",
  },
  {
    id: "faixa4",
    label: "Faixa 4 — Classe Média",
    rendaMin: 9600.01,
    rendaMax: 13000,
    taxaJuros: 10.0,
    valorMaxImovel: 600000,
    prazoMaxMeses: 240,
    subsidioMax: 0,
    descricao: "Renda familiar bruta de R$ 9.600,01 até R$ 13.000/mês. Programa Classe Média (2025).",
    cor: "bg-purple-100 border-purple-500 text-purple-800",
  },
];

// ── Cálculo pelo Sistema Price (parcelas fixas) ───────────────────────────────
function calcularParcela(pv: number, taxaAa: number, meses: number): number {
  if (pv <= 0 || meses <= 0) return 0;
  const i = taxaAa / 100 / 12; // taxa mensal
  if (i === 0) return pv / meses;
  return (pv * i * Math.pow(1 + i, meses)) / (Math.pow(1 + i, meses) - 1);
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function detectarFaixa(renda: number): Faixa | null {
  return FAIXAS.find((f) => renda >= f.rendaMin && renda <= f.rendaMax) ?? null;
}

export default function SimuladorMCMV() {
  const [renda, setRenda] = useState<string>("");
  const [valorImovel, setValorImovel] = useState<string>("");
  const [entrada, setEntrada] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("360");
  const [faixaSelecionada, setFaixaSelecionada] = useState<Faixa | null>(null);
  const [resultado, setResultado] = useState<{
    parcela: number;
    totalPago: number;
    totalJuros: number;
    subsidio: number;
    saldoFinanciar: number;
    capacidadeMaxima: number;
    apto: boolean;
    motivo?: string;
  } | null>(null);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  const rendaNum = parseFloat(renda.replace(/\./g, "").replace(",", ".")) || 0;
  const valorNum = parseFloat(valorImovel.replace(/\./g, "").replace(",", ".")) || 0;
  const entradaNum = parseFloat(entrada.replace(/\./g, "").replace(",", ".")) || 0;
  const prazoNum = parseInt(prazo) || 360;

  const faixaDetectada = detectarFaixa(rendaNum);

  const simular = useCallback(() => {
    const faixa = faixaSelecionada ?? faixaDetectada;
    if (!faixa) {
      setResultado({ parcela: 0, totalPago: 0, totalJuros: 0, subsidio: 0, saldoFinanciar: 0, capacidadeMaxima: 0, apto: false, motivo: "Informe sua renda mensal para detectar a faixa." });
      return;
    }

    if (valorNum <= 0) {
      setResultado({ parcela: 0, totalPago: 0, totalJuros: 0, subsidio: 0, saldoFinanciar: 0, capacidadeMaxima: 0, apto: false, motivo: "Informe o valor do imóvel." });
      return;
    }

    const prazoEfetivo = Math.min(prazoNum, faixa.prazoMaxMeses);
    const entradaEfetiva = entradaNum > 0 ? entradaNum : valorNum * 0.20;
    const entradaMinima = valorNum * 0.20;

    if (entradaEfetiva < entradaMinima * 0.99) {
      setResultado({ parcela: 0, totalPago: 0, totalJuros: 0, subsidio: 0, saldoFinanciar: 0, capacidadeMaxima: 0, apto: false, motivo: `A entrada mínima é de 20% do valor do imóvel (${formatarMoeda(entradaMinima)}).` });
      return;
    }

    if (valorNum > faixa.valorMaxImovel) {
      setResultado({ parcela: 0, totalPago: 0, totalJuros: 0, subsidio: 0, saldoFinanciar: 0, capacidadeMaxima: 0, apto: false, motivo: `O valor máximo do imóvel para ${faixa.label} é ${formatarMoeda(faixa.valorMaxImovel)}.` });
      return;
    }

    // Subsídio estimado (Faixa 1 e 2 apenas)
    let subsidio = 0;
    if (faixa.id === "faixa1") subsidio = Math.min(faixa.subsidioMax, valorNum * 0.25);
    if (faixa.id === "faixa2") subsidio = Math.min(faixa.subsidioMax, valorNum * 0.10);

    const saldoFinanciar = Math.max(0, valorNum - entradaEfetiva - subsidio);
    const parcela = calcularParcela(saldoFinanciar, faixa.taxaJuros, prazoEfetivo);
    const totalPago = parcela * prazoEfetivo;
    const totalJuros = totalPago - saldoFinanciar;

    // Comprometimento de renda: parcela ≤ 30% da renda (regra geral CEF)
    const limiteParcelaRenda = rendaNum * 0.30;
    const apto = parcela <= limiteParcelaRenda;

    // Capacidade máxima: quanto pode financiar com 30% da renda
    const capacidadeMaxima = calcularCapacidadeMaxima(rendaNum * 0.30, faixa.taxaJuros, prazoEfetivo);

    setResultado({ parcela, totalPago, totalJuros, subsidio, saldoFinanciar, capacidadeMaxima, apto,
      motivo: apto
        ? undefined
        : `A parcela estimada (${formatarMoeda(parcela)}) ultrapassa 30% da sua renda (${formatarMoeda(limiteParcelaRenda)}). Considere um imóvel de menor valor ou maior entrada.`
    });
  }, [rendaNum, valorNum, entradaNum, prazoNum, faixaSelecionada, faixaDetectada]);

  function calcularCapacidadeMaxima(parcelaMax: number, taxaAa: number, meses: number): number {
    const i = taxaAa / 100 / 12;
    if (i === 0) return parcelaMax * meses;
    return (parcelaMax * (Math.pow(1 + i, meses) - 1)) / (i * Math.pow(1 + i, meses));
  }

  function handleInput(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const num = parseInt(raw || "0") / 100;
      setter(num > 0 ? num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    };
  }

  const FAQ = [
    {
      q: "Quem pode participar do programa?",
      a: "Brasileiros sem imóvel em qualquer parte do Brasil, não ter recebido benefício habitacional do governo federal anteriormente, e ter renda familiar mensal dentro dos limites do programa (até R$ 13.000/mês para a Faixa 4 - Classe Média)."
    },
    {
      q: "O que é a Faixa 4 - Classe Média?",
      a: "Criada em 2025, a Faixa 4 atende famílias com renda entre R$ 9.600,01 e R$ 13.000/mês, com taxa de 10% a.a. e imóveis de até R$ 600.000. Sem subsídio direto, mas com acesso a crédito no âmbito do programa."
    },
    {
      q: "Posso usar o FGTS?",
      a: "Sim. Trabalhadores com conta ativa há pelo menos 3 anos podem usar o FGTS na entrada, amortização ou liquidação do saldo devedor. Para Faixas 1, 2 e 3 urbanas, o FGTS pode reduzir ainda mais o saldo a financiar."
    },
    {
      q: "O subsídio precisa ser devolvido?",
      a: "Não. O subsídio habitacional das Faixas 1 e 2 é uma doação do governo federal, não precisa ser pago de volta. É descontado diretamente do valor do imóvel ou do saldo a financiar."
    },
    {
      q: "Qual a taxa de juros real?",
      a: "As taxas variam conforme faixa, localidade, composição familiar e se o trabalhador é cotista do FGTS. Os valores exibidos são referências baseadas na Portaria MCID nº 333, de 01/04/2026. Para a taxa exata, consulte a Caixa Econômica Federal ou um banco conveniado."
    },
    {
      q: "Qual a diferença entre Sistema Price e SAC?",
      a: "No Sistema Price (utilizado aqui), as parcelas são fixas ao longo do financiamento. No SAC (Sistema de Amortização Constante), as parcelas começam maiores e diminuem progressivamente. O SAC cobra menos juros no total. A Caixa oferece ambas as opções para o MCMV."
    },
  ];

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero */}
      <div className="bg-brand-dark text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Home className="w-12 h-12 text-brand-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
            Simulador Minha Casa Minha Vida
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto">
            Calcule suas parcelas com base nos dados oficiais do programa federal.
            Valores baseados na <strong className="text-white">Portaria MCID nº 333 de 01/04/2026</strong>.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Faixas de renda */}
        <section>
          <h2 className="text-lg font-heading font-bold text-brand-dark mb-4">Faixas do Programa (2026)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FAIXAS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFaixaSelecionada(faixaSelecionada?.id === f.id ? null : f)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${f.cor} ${faixaSelecionada?.id === f.id ? "ring-2 ring-brand-goldVivid scale-[1.02]" : "opacity-80 hover:opacity-100"}`}
              >
                <p className="font-bold text-sm mb-1">{f.label}</p>
                <p className="text-xs leading-relaxed">
                  até {formatarMoeda(f.rendaMax)}/mês
                </p>
                <p className="text-xs mt-1 font-semibold">
                  Juros: {f.taxaJuros.toFixed(2).replace(".", ",")}% a.a.
                </p>
                <p className="text-xs mt-0.5">
                  Imóvel até {formatarMoeda(f.valorMaxImovel)}
                </p>
                {f.subsidioMax > 0 && (
                  <p className="text-xs mt-0.5 font-semibold text-green-700">
                    Subsídio até {formatarMoeda(f.subsidioMax)}
                  </p>
                )}
              </button>
            ))}
          </div>
          {faixaSelecionada && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Faixa selecionada manualmente: <strong>{faixaSelecionada.label}</strong>.{" "}
              <button type="button" className="underline text-brand-goldVivid" onClick={() => setFaixaSelecionada(null)}>
                Usar faixa automática pela renda
              </button>
            </p>
          )}
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-brand-goldVivid" />
            <h2 className="text-lg font-heading font-bold text-brand-dark">Calcule seu financiamento</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Renda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Renda familiar bruta mensal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={renda}
                  onChange={handleInput(setRenda)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              {rendaNum > 0 && !faixaSelecionada && (
                <p className="text-xs mt-1 text-gray-500">
                  {faixaDetectada
                    ? <>Faixa detectada: <strong className="text-brand-dark">{faixaDetectada.label}</strong> ({faixaDetectada.taxaJuros.toFixed(2).replace(".", ",")}% a.a.)</>
                    : <span className="text-red-600">Renda acima do limite do programa (R$ 13.000/mês).</span>
                  }
                </p>
              )}
            </div>

            {/* Valor do imóvel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Valor do imóvel <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valorImovel}
                  onChange={handleInput(setValorImovel)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            {/* Entrada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Valor da entrada
                <span className="text-gray-400 text-xs font-normal ml-1">(mín. 20% do imóvel)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={entrada}
                  onChange={handleInput(setEntrada)}
                  placeholder={valorNum > 0 ? formatarMoeda(valorNum * 0.20).replace("R$ ", "") : "0,00"}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              {valorNum > 0 && (
                <p className="text-xs mt-1 text-gray-500">
                  Entrada mínima: <strong>{formatarMoeda(valorNum * 0.20)}</strong>
                </p>
              )}
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Prazo do financiamento
              </label>
              <select
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
              >
                <option value="120">10 anos (120 meses)</option>
                <option value="180">15 anos (180 meses)</option>
                <option value="240">20 anos (240 meses)</option>
                <option value="300">25 anos (300 meses)</option>
                <option value="360">30 anos (360 meses) — máximo Faixas 1, 2 e 3</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={simular}
            className="mt-6 w-full bg-brand-goldVivid text-white font-semibold py-3 rounded-xl hover:opacity-90 transition text-sm"
          >
            Simular financiamento
          </button>
        </section>

        {/* Resultado */}
        {resultado && (
          <section className={`rounded-2xl border-2 p-6 ${resultado.apto ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}`}>
            <h2 className={`text-lg font-heading font-bold mb-4 ${resultado.apto ? "text-green-800" : "text-red-800"}`}>
              {resultado.apto ? "✅ Financiamento viável" : "⚠️ Atenção"}
            </h2>

            {!resultado.apto && resultado.motivo && (
              <p className="text-sm text-red-700 mb-4 bg-red-100 rounded-lg p-3">
                {resultado.motivo}
              </p>
            )}

            {resultado.apto && resultado.saldoFinanciar > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Parcela mensal estimada</p>
                  <p className="text-2xl font-bold text-brand-dark">{formatarMoeda(resultado.parcela)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sistema Price (parcelas fixas)</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Saldo a financiar</p>
                  <p className="text-xl font-bold text-brand-dark">{formatarMoeda(resultado.saldoFinanciar)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Após entrada{resultado.subsidio > 0 ? " e subsídio" : ""}</p>
                </div>
                {resultado.subsidio > 0 && (
                  <div className="bg-green-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Subsídio estimado</p>
                    <p className="text-xl font-bold text-green-700">{formatarMoeda(resultado.subsidio)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Desconto do governo federal</p>
                  </div>
                )}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total pago ao final</p>
                  <p className="text-xl font-bold text-brand-dark">{formatarMoeda(resultado.totalPago)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Saldo + juros totais</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total de juros pagos</p>
                  <p className="text-xl font-bold text-orange-600">{formatarMoeda(resultado.totalJuros)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Capacidade máx. de financiamento</p>
                  <p className="text-xl font-bold text-blue-700">{formatarMoeda(resultado.capacidadeMaxima)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Com 30% da sua renda</p>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              <Info className="inline w-3.5 h-3.5 mr-1 relative -top-px" />
              Simulação meramente estimativa. Taxas, subsídios e condições reais dependem de análise de crédito,
              localidade, composição familiar e disponibilidade de recursos no programa. Consulte a{" "}
              <a href="https://www.caixa.gov.br/voce/habitacao/minha-casa-minha-vida" target="_blank" rel="noopener noreferrer" className="underline text-brand-goldVivid">
                Caixa Econômica Federal
              </a>{" "}
              ou um correspondente bancário.
            </p>
          </section>
        )}

        {/* Tabela de taxas oficiais */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-heading font-bold text-brand-dark mb-4">
            Tabela de referência — Portaria MCID nº 333 (01/04/2026)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Faixa</th>
                  <th className="pb-2 pr-4">Renda mensal</th>
                  <th className="pb-2 pr-4">Juros (ref.)</th>
                  <th className="pb-2 pr-4">Imóvel máximo</th>
                  <th className="pb-2 pr-4">Prazo máx.</th>
                  <th className="pb-2">Subsídio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {FAIXAS.map((f) => (
                  <tr key={f.id} className="py-2">
                    <td className="py-2.5 pr-4 font-semibold text-brand-dark">{f.label}</td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {f.rendaMin === 0 ? "Até" : `R$ ${f.rendaMin.toLocaleString("pt-BR")} até`}{" "}
                      {formatarMoeda(f.rendaMax)}/mês
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-brand-goldVivid font-semibold">
                      {f.taxaJuros.toFixed(2).replace(".", ",")}% a.a.
                    </td>
                    <td className="py-2.5 pr-4">{formatarMoeda(f.valorMaxImovel)}</td>
                    <td className="py-2.5 pr-4">{f.prazoMaxMeses / 12} anos</td>
                    <td className="py-2.5">
                      {f.subsidioMax > 0
                        ? <span className="text-green-700 font-semibold">Até {formatarMoeda(f.subsidioMax)}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            * Taxas para cotistas FGTS em municípios de maior demanda (SP, RJ, DF, capitais nordestinas).
            Municípios menores podem ter taxas reduzidas. Faixa 1 pode ter juros ainda menores conforme
            subprograma (ex.: imóveis em área rural, indígenas, quilombolas).
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-heading font-bold text-brand-dark mb-4">Perguntas frequentes</h2>
          <div className="space-y-2">
            {FAQ.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFaqAberto(faqAberto === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-brand-dark hover:bg-gray-50 transition"
                >
                  {item.q}
                  {faqAberto === idx ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </button>
                {faqAberto === idx && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Aviso legal */}
        <div className="text-xs text-gray-400 text-center pb-6 leading-relaxed">
          Este simulador é uma ferramenta informativa. Os valores calculados são estimativas e não constituem
          proposta de crédito ou garantia de aprovação. As condições finais de financiamento são definidas
          pela instituição financeira operadora após análise de crédito e vistoria do imóvel.
          Fonte oficial: <a href="https://www.gov.br/cidades/pt-br/acoes-e-programas/habitacao/minha-casa-minha-vida" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-goldVivid">gov.br/cidades — Minha Casa Minha Vida</a>.
        </div>
      </div>
    </div>
  );
}
