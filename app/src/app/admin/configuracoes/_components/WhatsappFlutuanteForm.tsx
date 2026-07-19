"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";
import { OPCOES_ICONE_WHATSAPP, ChaveIconeWhatsapp } from "@/lib/icones";

type Dados = {
  whatsappBotaoAtivo: boolean;
  whatsappBotaoNumero: string | null;
  whatsappBotaoMensagem: string;
  whatsappBotaoPosicao: string;
  whatsappBotaoIcone: string;
};

const POSICOES: { valor: string; label: string }[] = [
  { valor: "bottom-right", label: "Canto inferior direito" },
  { valor: "bottom-left", label: "Canto inferior esquerdo" }
];

export default function WhatsappFlutuanteForm() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetch("/api/imobiliaria")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setErroCarregamento(`Erro ${r.status}: ${data.erro || "Falha ao carregar."}`); return; }
        setDados({
          whatsappBotaoAtivo: !!data.imobiliaria?.whatsappBotaoAtivo,
          whatsappBotaoNumero: data.imobiliaria?.whatsappBotaoNumero ?? null,
          whatsappBotaoMensagem: data.imobiliaria?.whatsappBotaoMensagem || "Olá! Como podemos ajudar?",
          whatsappBotaoPosicao: data.imobiliaria?.whatsappBotaoPosicao || "bottom-right",
          whatsappBotaoIcone: data.imobiliaria?.whatsappBotaoIcone || "whatsapp"
        });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-brand-dark">Balão flutuante de WhatsApp</h2>
          <p className="text-sm text-gray-500">
            Exibe um botão flutuante na vitrine pública para o visitante falar direto no WhatsApp. Ao navegar em um
            imóvel específico, a mensagem já inclui o código e o título dele.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-4">
          <input
            type="checkbox"
            checked={dados.whatsappBotaoAtivo}
            onChange={(e) => setDados({ ...dados, whatsappBotaoAtivo: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Ativo</span>
        </label>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Configuração do WhatsApp atualizada!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-sm text-red-600 rounded-md px-3 py-2">{erro}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número do WhatsApp</label>
        <input
          type="text"
          placeholder="(12) 99876-5432"
          value={dados.whatsappBotaoNumero || ""}
          onChange={(e) => setDados({ ...dados, whatsappBotaoNumero: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Se deixado em branco, será usado o número de WhatsApp cadastrado em Contato e localização.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem flutuante (balão de saudação)</label>
        <input
          type="text"
          maxLength={160}
          placeholder="Olá! Como podemos ajudar?"
          value={dados.whatsappBotaoMensagem}
          onChange={(e) => setDados({ ...dados, whatsappBotaoMensagem: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Posição do botão</label>
          <select
            value={dados.whatsappBotaoPosicao}
            onChange={(e) => setDados({ ...dados, whatsappBotaoPosicao: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {POSICOES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(OPCOES_ICONE_WHATSAPP) as [ChaveIconeWhatsapp, (typeof OPCOES_ICONE_WHATSAPP)[ChaveIconeWhatsapp]][]).map(
              ([chave, { label, Icone }]) => (
                <button
                  key={chave}
                  type="button"
                  title={label}
                  onClick={() => setDados({ ...dados, whatsappBotaoIcone: chave })}
                  className={`flex items-center justify-center border rounded-md py-2 transition ${
                    dados.whatsappBotaoIcone === chave
                      ? "border-brand-goldVivid bg-brand-goldVivid/10 text-brand-goldVivid"
                      : "border-gray-300 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <Icone className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
      >
        {salvando ? "Salvando..." : "Salvar WhatsApp flutuante"}
      </button>
    </div>
  );
}
