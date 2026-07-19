"use client";

import { useEffect, useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import ModalSucesso from "../../_components/ModalSucesso";

const OPCOES_ITENS = [6, 9, 12, 15, 18, 24, 30, 48];

export default function PaginacaoForm() {
  const [itensPorPagina, setItensPorPagina] = useState(12);
  const [tipoPaginacao, setTipoPaginacao] = useState<"paginada" | "scroll-infinito">("paginada");
  const [modoDestaque, setModoDestaque] = useState<"grade" | "especial">("grade");
  const [mcmvHabilitado, setMcmvHabilitado] = useState(false);
  const [blogMenuHabilitado, setBlogMenuHabilitado] = useState(true);
  const [blogHomepageHabilitado, setBlogHomepageHabilitado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/imobiliaria")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { setErro(`Erro ${r.status}: ${d.erro || "Falha ao carregar."}`); return; }
        if (d.imobiliaria?.itensPorPagina) setItensPorPagina(d.imobiliaria.itensPorPagina);
        if (d.imobiliaria?.tipoPaginacao) setTipoPaginacao(d.imobiliaria.tipoPaginacao);
        if (d.imobiliaria?.modoDestaque) setModoDestaque(d.imobiliaria.modoDestaque);
        if (typeof d.imobiliaria?.mcmvHabilitado         === "boolean") setMcmvHabilitado(d.imobiliaria.mcmvHabilitado);
        if (typeof d.imobiliaria?.blogMenuHabilitado     === "boolean") setBlogMenuHabilitado(d.imobiliaria.blogMenuHabilitado);
        if (typeof d.imobiliaria?.blogHomepageHabilitado === "boolean") setBlogHomepageHabilitado(d.imobiliaria.blogHomepageHabilitado);
      })
      .catch((e) => setErro(`Erro de conexão: ${e?.message || e}`))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    setErro(null);

    const r0 = await fetch("/api/imobiliaria");
    const d0 = await r0.json();
    if (!r0.ok) { setSalvando(false); setErro("Erro ao buscar dados."); return; }

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d0.imobiliaria, itensPorPagina, tipoPaginacao, modoDestaque, mcmvHabilitado, blogMenuHabilitado, blogHomepageHabilitado })
    });
    setSalvando(false);
    if (!resposta.ok) { setErro("Não foi possível salvar."); return; }
    setSucesso(true);
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (erro && !itensPorPagina) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 max-w-lg">
      <p className="text-sm font-semibold text-red-700 mb-1">Erro ao carregar configurações</p>
      <p className="text-xs text-red-600 font-mono">{erro}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-6 max-w-lg">
      <div>
        <h2 className="font-semibold text-brand-dark">Paginação</h2>
        <p className="text-sm text-gray-500">Controla como os imóveis são exibidos na listagem pública.</p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Paginação salva com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* Tipo de paginação */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Modo de exibição</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipoPaginacao("paginada")}
            className={`border-2 rounded-xl p-4 text-left transition ${
              tipoPaginacao === "paginada"
                ? "border-brand-gold bg-brand-gold/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-brand-dark mb-1">Paginação tradicional</div>
            <div className="text-xs text-gray-500">Imóveis divididos em páginas com botões de navegação (anterior / próxima).</div>
          </button>
          <button
            type="button"
            onClick={() => setTipoPaginacao("scroll-infinito")}
            className={`border-2 rounded-xl p-4 text-left transition ${
              tipoPaginacao === "scroll-infinito"
                ? "border-brand-gold bg-brand-gold/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-brand-dark mb-1">Scroll infinito</div>
            <div className="text-xs text-gray-500">Mais imóveis carregam automaticamente ao chegar no fim da página.</div>
          </button>
        </div>
      </div>

      {/* Quantidade por página/lote */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {tipoPaginacao === "paginada" ? "Imóveis por página" : "Imóveis por lote (scroll)"}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {OPCOES_ITENS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setItensPorPagina(n)}
              className={`border rounded-lg py-3 text-sm font-semibold transition ${
                itensPorPagina === n
                  ? "border-brand-gold bg-brand-gold/10 text-brand-dark"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {tipoPaginacao === "paginada"
            ? `Exibindo ${itensPorPagina} imóveis por página.`
            : `Carregando ${itensPorPagina} imóveis por vez no scroll.`}
        </p>
      </div>


      {/* Modo de destaque da página inicial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Layout dos imóveis em destaque</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setModoDestaque("grade")}
            className={`border-2 rounded-xl p-4 text-left transition ${
              modoDestaque === "grade"
                ? "border-brand-gold bg-brand-gold/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-brand-dark mb-1">Grade normal</div>
            <div className="text-xs text-gray-500">Todos os imóveis exibidos em grade uniforme.</div>
          </button>
          <button
            type="button"
            onClick={() => setModoDestaque("especial")}
            className={`border-2 rounded-xl p-4 text-left transition ${
              modoDestaque === "especial"
                ? "border-brand-gold bg-brand-gold/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-brand-dark mb-1">Destaque especial</div>
            <div className="text-xs text-gray-500">Primeiro imóvel em banner grande, demais em grade compacta.</div>
          </button>
        </div>
      </div>

      {/* Simulador MCMV */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Simulador Minha Casa Minha Vida</label>
        <div
          className={`flex items-start gap-4 border-2 rounded-xl p-4 cursor-pointer transition ${
            mcmvHabilitado ? "border-brand-gold bg-brand-gold/5" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setMcmvHabilitado((v) => !v)}
        >
          <button type="button" className={`mt-0.5 transition ${mcmvHabilitado ? "text-brand-goldVivid" : "text-gray-300"}`}>
            {mcmvHabilitado ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
          </button>
          <div>
            <div className="text-sm font-semibold text-brand-dark">
              {mcmvHabilitado ? "Habilitado" : "Desabilitado"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Exibe o link "Simular MCMV" no menu do site e torna a página da calculadora acessível.
            </div>
          </div>
        </div>
      </div>

      {/* Blog — visibilidade no menu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Blog — link no menu do site</label>
        <div
          className={`flex items-start gap-4 border-2 rounded-xl p-4 cursor-pointer transition ${
            blogMenuHabilitado ? "border-brand-gold bg-brand-gold/5" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setBlogMenuHabilitado((v) => !v)}
        >
          <button type="button" className={`mt-0.5 transition ${blogMenuHabilitado ? "text-brand-goldVivid" : "text-gray-300"}`}>
            {blogMenuHabilitado ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
          </button>
          <div>
            <div className="text-sm font-semibold text-brand-dark">
              {blogMenuHabilitado ? "Visível no menu" : "Oculto no menu"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Quando desabilitado, o link "Blog" some da barra de navegação do site.
            </div>
          </div>
        </div>
      </div>

      {/* Blog — seção na home */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Blog — seção na página inicial</label>
        <div
          className={`flex items-start gap-4 border-2 rounded-xl p-4 cursor-pointer transition ${
            blogHomepageHabilitado ? "border-brand-gold bg-brand-gold/5" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setBlogHomepageHabilitado((v) => !v)}
        >
          <button type="button" className={`mt-0.5 transition ${blogHomepageHabilitado ? "text-brand-goldVivid" : "text-gray-300"}`}>
            {blogHomepageHabilitado ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
          </button>
          <div>
            <div className="text-sm font-semibold text-brand-dark">
              {blogHomepageHabilitado ? "Exibindo na home" : "Oculto na home"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Quando habilitado, exibe os 3 artigos mais recentes do blog no final da página inicial.
            </div>
          </div>
        </div>
      </div>

      <button onClick={salvar} disabled={salvando} className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm">
        {salvando ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
