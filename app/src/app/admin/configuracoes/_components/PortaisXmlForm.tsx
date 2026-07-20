"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";
import { Copy, RefreshCw, CheckCircle } from "lucide-react";

const PORTAIS = [
  { id: "olx",      label: "OLX Imóveis",       path: "/api/feed/olx" },
  { id: "vivareal", label: "Viva Real",          path: "/api/feed/vivareal" },
  { id: "zap",      label: "ZAP Imóveis",        path: "/api/feed/zap" },
  { id: "meta",     label: "Meta (Facebook Ads)", path: "/api/feed/meta" },
];

export default function PortaisXmlForm() {
  const [habilitado, setHabilitado] = useState(false);
  const [token, setToken]           = useState("");
  const [salvando, setSalvando]     = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso]       = useState(false);
  const [erro, setErro]             = useState<string | null>(null);
  const [copiado, setCopiado]       = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/imobiliaria")
      .then((r) => r.json())
      .then((d) => {
        if (d.imobiliaria) {
          setHabilitado(d.imobiliaria.xmlHabilitado ?? false);
          setToken(d.imobiliaria.xmlToken || "");
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  function gerarToken() {
    const novo = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setToken(novo);
  }

  function urlPortal(path: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return token ? `${base}${path}?token=${token}` : `${base}${path}`;
  }

  function copiar(portalId: string, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(portalId);
      setTimeout(() => setCopiado(null), 2000);
    });
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
      body: JSON.stringify({ ...d0.imobiliaria, xmlHabilitado: habilitado, xmlToken: token || null }),
    });
    setSalvando(false);
    if (!resposta.ok) { setErro("Não foi possível salvar."); return; }
    setSucesso(true);
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Portais Imobiliários (XML)</h2>
        <p className="text-sm text-gray-500">
          Gere feeds XML para integração automática com os principais portais do Brasil.
          Cada portal recebe uma URL exclusiva que retorna seus imóveis disponíveis no formato correto.
        </p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Configurações de XML salvas!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* Toggle habilitar/desabilitar */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={habilitado}
          onChange={(e) => setHabilitado(e.target.checked)}
          className="w-4 h-4 accent-brand-gold"
        />
        <span className="text-sm font-medium text-gray-700">Habilitar feeds XML públicos</span>
      </label>

      {habilitado && (
        <>
          {/* Token de autenticação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token de autenticação</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Deixe vazio para feed público"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={gerarToken}
                title="Gerar token aleatório"
                className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                <RefreshCw size={15} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Use um token para proteger o feed. Compartilhe a URL completa (com token) apenas com os portais cadastrados.
            </p>
          </div>

          {/* URLs por portal */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">URLs dos feeds</p>
            {PORTAIS.map((portal) => {
              const url = urlPortal(portal.path);
              const jaCopiado = copiado === portal.id;
              return (
                <div key={portal.id}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{portal.label}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-xs bg-gray-50 font-mono text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => copiar(portal.id, url)}
                      title="Copiar URL"
                      className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
                    >
                      {jaCopiado ? (
                        <CheckCircle size={15} className="text-green-500" />
                      ) : (
                        <Copy size={15} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Como usar</p>
            <p>1. Gere e salve o token acima.</p>
            <p>2. Cadastre a URL do portal desejado na área de integrações do respectivo portal.</p>
            <p>3. O feed é atualizado automaticamente a cada requisição — não é necessário reenviar manualmente.</p>
          </div>
        </>
      )}

      <button
        onClick={salvar}
        disabled={salvando}
        className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
      >
        {salvando ? "Salvando..." : "Salvar configurações XML"}
      </button>
    </div>
  );
}
