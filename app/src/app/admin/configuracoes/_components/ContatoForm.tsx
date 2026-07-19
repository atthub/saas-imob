"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Imobiliaria = {
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  cidadePrincipal: string | null;
  estadoPrincipal: string | null;
};

export default function ContatoForm() {
  const [dados, setDados] = useState<Imobiliaria | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetch("/api/imobiliaria")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setErroCarregamento(`Erro ${r.status}: ${data.erro || "Falha ao carregar."}`); return; }
        setDados(data.imobiliaria);
      })
      .catch((e) => setErroCarregamento(`Erro de conexão: ${e?.message || e}`));
  }, []);

  async function salvar() {
    if (!dados) return;
    setSalvando(true);
    setErro(null);

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    const data = await resposta.json().catch(() => ({}));
    setSalvando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível salvar.");
      return;
    }
    setSucesso(true);
  }

  if (erroCarregamento) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 max-w-lg">
        <p className="text-sm font-semibold text-red-700 mb-1">Não foi possível carregar as configurações</p>
        <p className="text-xs text-red-600 font-mono">{erroCarregamento}</p>
      </div>
    );
  }

  if (!dados) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Contato e localização</h2>
        <p className="text-sm text-gray-500">
          Exibidos no cabeçalho e rodapé do site público (telefone, WhatsApp, endereço).
        </p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Contato atualizado com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-sm text-red-600 rounded-md px-3 py-2">{erro}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="text"
            placeholder="(12) 3456-7890"
            value={dados.telefone || ""}
            onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="text"
            placeholder="(12) 99876-5432"
            value={dados.whatsapp || ""}
            onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          type="email"
          value={dados.email || ""}
          onChange={(e) => setDados({ ...dados, email: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
        <input
          type="text"
          value={dados.endereco || ""}
          onChange={(e) => setDados({ ...dados, endereco: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade principal</label>
          <input
            type="text"
            value={dados.cidadePrincipal || ""}
            onChange={(e) => setDados({ ...dados, cidadePrincipal: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
          <input
            type="text"
            maxLength={2}
            placeholder="SP"
            value={dados.estadoPrincipal || ""}
            onChange={(e) => setDados({ ...dados, estadoPrincipal: e.target.value.toUpperCase() })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
      >
        {salvando ? "Salvando..." : "Salvar contato"}
      </button>
    </div>
  );
}
