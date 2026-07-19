"use client";

import { useEffect, useRef, useState } from "react";

type Progresso = { totalWp: number; jaImportados: number; restantes: number };
type Erro = { wpId: number; erro: string };

export default function ImportadorWordpress() {
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [carregandoProgresso, setCarregandoProgresso] = useState(true);
  const [rodando, setRodando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [erros, setErros] = useState<Erro[]>([]);
  const pararRef = useRef(false);

  async function carregarProgresso() {
    setCarregandoProgresso(true);
    setErroGeral(null);
    try {
      const resposta = await fetch("/api/admin/importar-wordpress");
      const data = await resposta.json();
      if (!resposta.ok) throw new Error(data.erro || "Falha ao consultar o WordPress.");
      setProgresso(data);
    } catch (e: any) {
      setErroGeral(e.message);
    } finally {
      setCarregandoProgresso(false);
    }
  }

  useEffect(() => {
    carregarProgresso();
  }, []);

  async function importarUmLote(quantidade: number) {
    const resposta = await fetch("/api/admin/importar-wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade })
    });
    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.erro || "Falha ao importar este lote.");
    return data as {
      totalWp: number;
      jaImportadosAntes: number;
      processadosNesteLote: number;
      importadosComSucesso: number;
      erros: Erro[];
      restantes: number;
    };
  }

  async function importarContinuamente() {
    setRodando(true);
    setErroGeral(null);
    pararRef.current = false;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (pararRef.current) break;
        const resultado = await importarUmLote(15);

        setProgresso({
          totalWp: resultado.totalWp,
          jaImportados: resultado.jaImportadosAntes + resultado.importadosComSucesso,
          restantes: resultado.restantes
        });
        if (resultado.erros.length > 0) {
          setErros((atual) => [...atual, ...resultado.erros]);
        }

        if (resultado.processadosNesteLote === 0 || resultado.restantes <= 0) break;
      }
    } catch (e: any) {
      setErroGeral(e.message);
    } finally {
      setRodando(false);
    }
  }

  function pararImportacao() {
    pararRef.current = true;
  }

  const percentual = progresso && progresso.totalWp > 0 ? Math.round((progresso.jaImportados / progresso.totalWp) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-5">
      {erroGeral && <div className="bg-red-50 text-sm text-red-600 rounded-md px-3 py-2">{erroGeral}</div>}

      {carregandoProgresso && <p className="text-sm text-gray-500">Consultando o banco do WordPress...</p>}

      {progresso && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {progresso.jaImportados} de {progresso.totalWp} anúncios importados
            </span>
            <span className="font-medium">{percentual}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-goldVivid transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!rodando ? (
          <button
            type="button"
            onClick={importarContinuamente}
            disabled={carregandoProgresso || (progresso?.restantes ?? 0) <= 0}
            className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
          >
            {progresso && progresso.restantes <= 0 ? "Tudo importado" : "Iniciar importação"}
          </button>
        ) : (
          <button
            type="button"
            onClick={pararImportacao}
            className="bg-gray-200 text-gray-700 font-semibold px-5 py-2 rounded-md hover:bg-gray-300 text-sm"
          >
            Parar após o lote atual
          </button>
        )}

        <button
          type="button"
          onClick={carregarProgresso}
          disabled={rodando}
          className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
        >
          Atualizar progresso
        </button>

        {rodando && <span className="text-sm text-gray-500">Importando, lote a lote — pode levar alguns minutos...</span>}
      </div>

      <p className="text-xs text-gray-400">
        Roda em lotes de 15 anúncios por vez para não atingir o limite de tempo do servidor. Pode fechar esta tela
        e voltar depois — anúncios já importados não são duplicados, então é seguro clicar em "Iniciar importação"
        de novo a qualquer momento para continuar de onde parou.
      </p>

      {erros.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-brand-dark">
            {erros.length} anúncio(s) com erro (não foram importados):
          </h3>
          <div className="max-h-56 overflow-y-auto border rounded-md divide-y text-xs">
            {erros.map((e, i) => (
              <div key={`${e.wpId}-${i}`} className="px-3 py-2 flex gap-2">
                <span className="font-medium text-gray-700 shrink-0">#{e.wpId}</span>
                <span className="text-gray-500">{e.erro}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
