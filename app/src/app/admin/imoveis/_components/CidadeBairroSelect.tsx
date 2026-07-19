"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, X } from "lucide-react";

type Bairro = { id: string; nome: string };
type Cidade = { id: string; nome: string; uf: string; bairros: Bairro[] };

export default function CidadeBairroSelect({
  cidadeId,
  bairroId,
  onChange
}: {
  cidadeId: string;
  bairroId: string;
  onChange: (cidadeId: string, bairroId: string) => void;
}) {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Nova cidade inline
  const [novaCidade, setNovaCidade] = useState(false);
  const [nomeCidade, setNomeCidade] = useState("");
  const [ufCidade, setUfCidade] = useState("");
  const [salvandoCidade, setSalvandoCidade] = useState(false);

  // Novo bairro inline
  const [novoBairro, setNovoBairro] = useState(false);
  const [nomeBairro, setNomeBairro] = useState("");
  const [salvandoBairro, setSalvandoBairro] = useState(false);

  const cidadeSelecionada = cidades.find((c) => c.id === cidadeId);
  const bairros = cidadeSelecionada?.bairros || [];

  useEffect(() => {
    fetch("/api/cidades")
      .then((r) => r.json())
      .then((d) => setCidades(d.cidades || []))
      .finally(() => setCarregando(false));
  }, []);

  async function criarCidade() {
    if (!nomeCidade.trim() || !ufCidade.trim()) return;
    setSalvandoCidade(true);
    const r = await fetch("/api/cidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeCidade.trim(), uf: ufCidade.trim().toUpperCase() })
    });
    const d = await r.json();
    if (d.cidade) {
      const nova: Cidade = { ...d.cidade, bairros: [] };
      setCidades((prev) =>
        [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome))
      );
      onChange(nova.id, "");
      setNovaCidade(false);
      setNomeCidade("");
      setUfCidade("");
    }
    setSalvandoCidade(false);
  }

  async function criarBairro() {
    if (!nomeBairro.trim() || !cidadeId) return;
    setSalvandoBairro(true);
    const r = await fetch("/api/bairros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeBairro.trim(), cidadeId })
    });
    const d = await r.json();
    if (d.bairro) {
      setCidades((prev) =>
        prev.map((c) =>
          c.id === cidadeId
            ? {
                ...c,
                bairros: [...c.bairros, d.bairro].sort((a, b) =>
                  a.nome.localeCompare(b.nome)
                )
              }
            : c
        )
      );
      onChange(cidadeId, d.bairro.id);
      setNovoBairro(false);
      setNomeBairro("");
    }
    setSalvandoBairro(false);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Cidade */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
          <MapPin className="w-3.5 h-3.5 text-brand-goldVivid" />
          Cidade
        </label>
        {!novaCidade ? (
          <div className="flex gap-2">
            <select
              value={cidadeId}
              onChange={(e) => onChange(e.target.value, "")}
              disabled={carregando}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="">{carregando ? "Carregando..." : "Selecione a cidade..."}</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.uf}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNovaCidade(true)}
              title="Cadastrar nova cidade"
              className="border border-gray-300 rounded-md px-2.5 text-gray-400 hover:text-brand-goldVivid hover:border-brand-goldVivid transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              value={nomeCidade}
              onChange={(e) => setNomeCidade(e.target.value)}
              placeholder="Nome da cidade"
              autoFocus
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              value={ufCidade}
              onChange={(e) => setUfCidade(e.target.value)}
              placeholder="UF"
              maxLength={2}
              className="w-14 border border-gray-300 rounded-md px-2 py-2 text-sm text-center uppercase"
            />
            <button
              type="button"
              onClick={criarCidade}
              disabled={salvandoCidade || !nomeCidade.trim() || !ufCidade.trim()}
              className="bg-brand-goldVivid text-white text-xs px-3 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
            >
              {salvandoCidade ? "..." : "OK"}
            </button>
            <button
              type="button"
              onClick={() => { setNovaCidade(false); setNomeCidade(""); setUfCidade(""); }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bairro */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
        {!novoBairro ? (
          <div className="flex gap-2">
            <select
              value={bairroId}
              onChange={(e) => onChange(cidadeId, e.target.value)}
              disabled={!cidadeId}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {cidadeId ? "Selecione o bairro..." : "Escolha a cidade primeiro"}
              </option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
            {cidadeId && (
              <button
                type="button"
                onClick={() => setNovoBairro(true)}
                title="Cadastrar novo bairro"
                className="border border-gray-300 rounded-md px-2.5 text-gray-400 hover:text-brand-goldVivid hover:border-brand-goldVivid transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              value={nomeBairro}
              onChange={(e) => setNomeBairro(e.target.value)}
              placeholder="Nome do bairro"
              autoFocus
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={criarBairro}
              disabled={salvandoBairro || !nomeBairro.trim()}
              className="bg-brand-goldVivid text-white text-xs px-3 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
            >
              {salvandoBairro ? "..." : "OK"}
            </button>
            <button
              type="button"
              onClick={() => { setNovoBairro(false); setNomeBairro(""); }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
