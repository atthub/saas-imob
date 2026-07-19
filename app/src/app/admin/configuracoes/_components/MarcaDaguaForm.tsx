"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Imobiliaria = {
  id: string;
  nome: string;
  logoUrl: string | null;
  marcaDaguaUrl: string | null;
  marcaDaguaTamanho: number;
  marcaDaguaPosicao: string;
};

const POSICOES: [string, string][] = [
  ["top-left", "Superior esquerda"],
  ["top-right", "Superior direita"],
  ["bottom-left", "Inferior esquerda"],
  ["bottom-right", "Inferior direita"],
  ["center", "Centro"]
];

export default function MarcaDaguaForm() {
  const [dados, setDados] = useState<Imobiliaria | null>(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  async function carregar() {
    try {
      const resposta = await fetch("/api/imobiliaria");
      const data = await resposta.json().catch(() => ({}));
      if (!resposta.ok) { setErroCarregamento(`Erro ${resposta.status}: ${data.erro || "Falha ao carregar."}`); return; }
      setDados(data.imobiliaria);
    } catch (e) {
      setErroCarregamento(`Erro de conexão: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function enviarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEnviandoImagem(true);
    setMensagem(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const resposta = await fetch("/api/upload/marca-dagua", { method: "POST", body: formData });
    const data = await resposta.json().catch(() => ({}));
    setEnviandoImagem(false);
    e.target.value = "";

    if (!resposta.ok) {
      setMensagem(data.erro || "Não foi possível enviar a imagem.");
      return;
    }
    await carregar();
    setMensagem("Imagem da marca d'água atualizada.");
  }

  async function salvarConfiguracoes() {
    if (!dados) return;
    setSalvando(true);
    setMensagem(null);

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marcaDaguaTamanho: dados.marcaDaguaTamanho,
        marcaDaguaPosicao: dados.marcaDaguaPosicao
      })
    });
    const data = await resposta.json().catch(() => ({}));
    setSalvando(false);

    if (!resposta.ok) {
      setMensagem(data.erro || "Não foi possível salvar.");
      return;
    }
    setDados(data.imobiliaria);
    setSucesso(true);
  }

  if (erroCarregamento) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 max-w-lg">
        <p className="text-sm font-semibold text-red-700 mb-1">Não foi possível carregar as configurações</p>
        <p className="text-xs text-red-600 font-mono">{erroCarregamento}</p>
        <button onClick={carregar} className="mt-3 text-xs font-semibold text-red-700 underline hover:no-underline">Tentar novamente</button>
      </div>
    );
  }

  if (!dados) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  const imagemAtual = dados.marcaDaguaUrl || dados.logoUrl;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-5 max-w-xl">
      <h2 className="font-semibold text-brand-dark">Marca d'água das fotos dos imóveis</h2>
      <p className="text-sm text-gray-500">
        Escolha a imagem usada como marca d'água (pode ser a logo da imobiliária ou outra imagem),
        o tamanho dela em relação à foto e em qual canto ela aparece. Se nenhuma imagem for
        definida, o sistema usa o nome da imobiliária como marca de texto.
      </p>

      <ModalSucesso aberto={sucesso} mensagem="Configurações salvas com sucesso!" onClose={() => setSucesso(false)} />
      {mensagem && <div className="bg-brand-light text-sm text-gray-700 rounded-md px-3 py-2">{mensagem}</div>}

      <div className="flex items-center gap-4">
        <div className="w-28 h-20 border rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
          {imagemAtual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagemAtual} alt="Marca d'água atual" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400 text-center px-1">Sem imagem (usa texto)</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem da marca d'água</label>
          <input type="file" accept="image/*" onChange={enviarImagem} disabled={enviandoImagem} className="text-sm" />
          {enviandoImagem && <p className="text-xs text-gray-500 mt-1">Enviando...</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tamanho ({dados.marcaDaguaTamanho}% da largura da foto)
          </label>
          <input
            type="range"
            min={5}
            max={60}
            value={dados.marcaDaguaTamanho}
            onChange={(e) => setDados({ ...dados, marcaDaguaTamanho: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Posição na foto</label>
          <select
            value={dados.marcaDaguaPosicao}
            onChange={(e) => setDados({ ...dados, marcaDaguaPosicao: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {POSICOES.map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={salvarConfiguracoes}
        disabled={salvando}
        className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
      >
        {salvando ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
