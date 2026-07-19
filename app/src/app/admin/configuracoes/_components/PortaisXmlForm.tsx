"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";
import { Copy, RefreshCw } from "lucide-react";

export default function PortaisXmlForm() {
  const [habilitado, setHabilitado] = useState(false);
  const [token, setToken] = useState("");
  const [urlFeed, setUrlFeed] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/imobiliaria")
      .then((r) => r.json())
      .then((d) => {
        if (d.imobiliaria) {
          setHabilitado(d.imobiliaria.xmlHabilitado ?? false);
          setToken(d.imobiliaria.xmlToken || "");
          setUrlFeed(`${window.location.origin}/api/feed/xml${d.imobiliaria.xmlToken ? `?token=${d.imobiliaria.xmlToken}` : ""}`);
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  function gerarToken() {
    const novo = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setToken(novo);
    setUrlFeed(`${window.location.origin}/api/feed/xml?token=${novo}`);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);

    const r0 = await fetch("/api/imobiliaria");
    const d0 = await r0.json();
    if (!r0.ok) { setSalvando(false); setErro("Erro ao buscar dados."); return; }

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d0.imobiliaria, xmlHabilitado: habilitado, xmlToken: token || null })
    });
    setSalvando(false);
    if (!resposta.ok) { setErro("Não foi possível salvar."); return; }
    setSucesso(true);
  }

  function copiarUrl() {
    navigator.clipboard.writeText(urlFeed).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-6 max-w-xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Portais (XML)</h2>
        <p className="text-sm text-gray-500">
          Gere um feed XML dos seus imóveis para integração com portais imobiliários como ZAP, Viva Real e OLX.
        </p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Configurações de XML salvas!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={habilitado} onChange={(e) => setHabilitado(e.target.checked)} className="w-4 h-4 accent-brand-gold" />
        <span className="text-sm font-medium text-gray-700">Habilitar feed XML público</span>
      </label>

      {habilitado && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token de autenticação</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setUrlFeed(`${window.location.origin}/api/feed/xml${e.target.value ? `?token=${e.target.value}` : ""}`);
                }}
                placeholder="Deixe vazio para feed público"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
              />
              <button type="button" onClick={gerarToken} title="Gerar token aleatório" className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50">
                <RefreshCw size={15} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Adicione um token para proteger o feed contra acesso não autorizado.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL do feed XML</label>
            <div className="flex gap-2">
              <input type="text" value={urlFeed} readOnly className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 font-mono text-gray-600" />
              <button type="button" onClick={copiarUrl} className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50">
                <Copy size={15} className={copiado ? "text-green-500" : "text-gray-500"} />
              </button>
            </div>
            {copiado && <p className="text-xs text-green-600 mt-1">URL copiada!</p>}
          </div>
        </>
      )}

      <button onClick={salvar} disabled={salvando} className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm">
        {salvando ? "Salvando..." : "Salvar configurações XML"}
      </button>
    </div>
  );
}
