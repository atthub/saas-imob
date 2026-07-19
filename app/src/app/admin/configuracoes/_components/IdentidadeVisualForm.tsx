"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Imobiliaria = {
  id: string;
  nome: string;
  creci: string | null;
  descricao: string | null;
  logoUrl: string | null;
  logoAltura: number;
  faviconUrl: string | null;
  heroTitulo: string;
  heroSubtitulo: string;
  templateId: string | null;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  corFundo: string;
  fontHeading: string;
  fontBody: string;
};

type Template = {
  id: string;
  nome: string;
  descricao: string | null;
};

const FONTES = [
  "Inter",
  "Oxygen",
  "Roboto",
  "Open Sans",
  "Poppins",
  "Montserrat",
  "Lato",
  "Nunito",
  "Playfair Display",
  "Merriweather"
];

export default function IdentidadeVisualForm() {
  const [dados, setDados] = useState<Imobiliaria | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoFavicon, setEnviandoFavicon] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  async function carregar() {
    setErroCarregamento(null);
    try {
      const [respImobiliaria, respTemplates] = await Promise.all([
        fetch("/api/imobiliaria"),
        fetch("/api/templates")
      ]);
      const dataImobiliaria = await respImobiliaria.json().catch(() => ({}));
      if (respImobiliaria.ok) {
        setDados(dataImobiliaria.imobiliaria);
      } else {
        setErroCarregamento(`Erro ${respImobiliaria.status}: ${dataImobiliaria.erro || "Falha ao carregar dados."}`);
        return;
      }
      const dataTemplates = await respTemplates.json().catch(() => ({ templates: [] }));
      if (respTemplates.ok) setTemplates(dataTemplates.templates || []);
    } catch (e) {
      setErroCarregamento(`Erro de conexão: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function enviarImagem(e: React.ChangeEvent<HTMLInputElement>, rota: "logo" | "favicon") {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const setEnviando = rota === "logo" ? setEnviandoLogo : setEnviandoFavicon;
    setEnviando(true);
    setMensagem(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const resposta = await fetch(`/api/upload/${rota}`, { method: "POST", body: formData });
    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);
    e.target.value = "";

    if (!resposta.ok) {
      setMensagem(data.erro || "Não foi possível enviar a imagem.");
      return;
    }
    await carregar();
    setMensagem(rota === "logo" ? "Logo atualizada." : "Favicon atualizado.");
  }

  async function salvar() {
    if (!dados) return;
    setSalvando(true);
    setMensagem(null);

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: dados.nome,
        creci: dados.creci,
        descricao: dados.descricao,
        logoAltura: dados.logoAltura,
        heroTitulo: dados.heroTitulo,
        heroSubtitulo: dados.heroSubtitulo,
        corPrimaria: dados.corPrimaria,
        corSecundaria: dados.corSecundaria,
        corDestaque: dados.corDestaque,
        corFundo: dados.corFundo,
        fontHeading: dados.fontHeading,
        fontBody: dados.fontBody,
        templateId: dados.templateId
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

  const CAMPOS_COR: { chave: keyof Imobiliaria; label: string }[] = [
    { chave: "corPrimaria", label: "Cor primária (fundos escuros, header)" },
    { chave: "corSecundaria", label: "Cor secundária (detalhes, títulos)" },
    { chave: "corDestaque", label: "Cor de destaque (botões, CTAs)" },
    { chave: "corFundo", label: "Cor de fundo (seções claras)" }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Identidade visual</h2>
        <p className="text-sm text-gray-500">
          Nome, logo, favicon, cores e fontes usadas no site público e no painel administrativo.
        </p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Configurações salvas com sucesso!" onClose={() => setSucesso(false)} />
      {mensagem && <div className="bg-brand-light text-sm text-gray-700 rounded-md px-3 py-2">{mensagem}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da imobiliária</label>
          <input
            type="text"
            value={dados.nome}
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CRECI</label>
          <input
            type="text"
            value={dados.creci || ""}
            onChange={(e) => setDados({ ...dados, creci: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (sobre a empresa)</label>
        <textarea
          value={dados.descricao || ""}
          onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => enviarImagem(e, "logo")}
            disabled={enviandoLogo}
            className="text-sm"
          />
          {enviandoLogo && <p className="text-xs text-gray-500 mt-1">Enviando...</p>}
          <div className="mt-2 w-24 h-16 border rounded-md bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {dados.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dados.logoUrl}
                alt="Logo atual"
                style={{ height: Math.min(dados.logoAltura, 56) }}
                className="max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">Sem logo</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
          <input
            type="file"
            accept="image/png,image/x-icon,image/svg+xml"
            onChange={(e) => enviarImagem(e, "favicon")}
            disabled={enviandoFavicon}
            className="text-sm"
          />
          {enviandoFavicon && <p className="text-xs text-gray-500 mt-1">Enviando...</p>}
          <div className="mt-2 w-16 h-16 border rounded-md bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {dados.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dados.faviconUrl} alt="Favicon atual" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">Sem favicon</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Altura da logo na navbar do site ({dados.logoAltura}px)
        </label>
        <input
          type="range"
          min={20}
          max={160}
          value={dados.logoAltura}
          onChange={(e) => setDados({ ...dados, logoAltura: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-gray-400 mt-1">A largura se ajusta automaticamente, mantendo a proporção da imagem.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Texto da Hero (banner principal do site)</h3>
        <p className="text-xs text-gray-400 mb-3">
          Limite de caracteres para garantir que o texto não quebre o layout no desktop nem no mobile.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título ({dados.heroTitulo.length}/70)
            </label>
            <input
              type="text"
              value={dados.heroTitulo}
              maxLength={70}
              onChange={(e) => setDados({ ...dados, heroTitulo: e.target.value.slice(0, 70) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo ({dados.heroSubtitulo.length}/160)
            </label>
            <textarea
              value={dados.heroSubtitulo}
              maxLength={160}
              rows={2}
              onChange={(e) => setDados({ ...dados, heroSubtitulo: e.target.value.slice(0, 160) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Cores da marca</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {CAMPOS_COR.map(({ chave, label }) => (
            <div key={chave}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={dados[chave] as string}
                  onChange={(e) => setDados({ ...dados, [chave]: e.target.value })}
                  className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={dados[chave] as string}
                  onChange={(e) => setDados({ ...dados, [chave]: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fonte dos títulos</label>
          <select
            value={dados.fontHeading}
            onChange={(e) => setDados({ ...dados, fontHeading: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {FONTES.map((fonte) => (
              <option key={fonte} value={fonte}>
                {fonte}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fonte do corpo de texto</label>
          <select
            value={dados.fontBody}
            onChange={(e) => setDados({ ...dados, fontBody: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {FONTES.map((fonte) => (
              <option key={fonte} value={fonte}>
                {fonte}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template da vitrine</label>
          <select
            value={dados.templateId || ""}
            onChange={(e) => setDados({ ...dados, templateId: e.target.value || null })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Padrão (atual)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nome}
              </option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Novos templates aparecerão aqui quando forem cadastrados.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
      >
        {salvando ? "Salvando..." : "Salvar identidade visual"}
      </button>
    </div>
  );
}
