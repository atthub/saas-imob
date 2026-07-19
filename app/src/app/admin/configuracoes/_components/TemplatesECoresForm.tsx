"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Imobiliaria = {
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  corFundo: string;
  fontHeading: string;
  fontBody: string;
  templateId: string | null;
};

type Template = {
  id: string;
  nome: string;
  descricao: string | null;
  thumbnailUrl: string | null;
  identificador: string;
};

const FONTES = [
  "Inter", "Oxygen", "Roboto", "Open Sans", "Poppins",
  "Montserrat", "Lato", "Nunito", "Playfair Display", "Merriweather"
];

const CAMPOS_COR: { chave: keyof Imobiliaria; label: string }[] = [
  { chave: "corPrimaria", label: "Cor primária (fundos escuros, header)" },
  { chave: "corSecundaria", label: "Cor secundária (detalhes, títulos)" },
  { chave: "corDestaque", label: "Cor de destaque (botões, CTAs)" },
  { chave: "corFundo", label: "Cor de fundo (seções claras)" }
];

// Presets de cores e fontes por template
const PRESETS: Record<string, Partial<Imobiliaria>> = {
  classico: {
    corPrimaria: "#1a1a2e", corSecundaria: "#c5a059",
    corDestaque: "#d4a843", corFundo: "#f5f7fa",
    fontHeading: "Oxygen", fontBody: "Inter"
  },
  colorido: {
    corPrimaria: "#c0392b", corSecundaria: "#e67e22",
    corDestaque: "#e74c3c", corFundo: "#fff8f5",
    fontHeading: "Montserrat", fontBody: "Open Sans"
  },
  compacto: {
    corPrimaria: "#2d3748", corSecundaria: "#718096",
    corDestaque: "#3182ce", corFundo: "#f7fafc",
    fontHeading: "Inter", fontBody: "Inter"
  },
  minimalista: {
    corPrimaria: "#1a1a1a", corSecundaria: "#888888",
    corDestaque: "#1a1a1a", corFundo: "#ffffff",
    fontHeading: "Playfair Display", fontBody: "Lato"
  },
  premium: {
    corPrimaria: "#0d0d0d", corSecundaria: "#c5a059",
    corDestaque: "#c5a059", corFundo: "#f0ede8",
    fontHeading: "Montserrat", fontBody: "Lato"
  }
};

// Miniaturas SVG inline por template
function ThumbnailSVG({ id }: { id: string }) {
  if (id === "classico") return (
    <svg viewBox="0 0 160 100" className="w-full rounded-md">
      <rect width="160" height="100" fill="#f5f7fa" />
      <rect width="160" height="28" fill="#1a1a2e" />
      <rect x="10" y="8" width="50" height="6" rx="2" fill="#c5a059" />
      <rect x="110" y="9" width="20" height="4" rx="2" fill="#c5a059" opacity="0.7" />
      <rect x="135" y="9" width="16" height="4" rx="2" fill="#c5a059" opacity="0.7" />
      <rect x="10" y="36" width="44" height="28" rx="3" fill="#e8e4dc" />
      <rect x="10" y="67" width="30" height="4" rx="1" fill="#1a1a2e" opacity="0.5" />
      <rect x="10" y="73" width="22" height="3" rx="1" fill="#c5a059" opacity="0.7" />
      <rect x="60" y="36" width="44" height="28" rx="3" fill="#e8e4dc" />
      <rect x="60" y="67" width="30" height="4" rx="1" fill="#1a1a2e" opacity="0.5" />
      <rect x="60" y="73" width="22" height="3" rx="1" fill="#c5a059" opacity="0.7" />
      <rect x="110" y="36" width="44" height="28" rx="3" fill="#e8e4dc" />
      <rect x="110" y="67" width="30" height="4" rx="1" fill="#1a1a2e" opacity="0.5" />
      <rect x="110" y="73" width="22" height="3" rx="1" fill="#c5a059" opacity="0.7" />
    </svg>
  );

  if (id === "colorido") return (
    <svg viewBox="0 0 160 100" className="w-full rounded-md">
      <rect width="160" height="100" fill="#fff8f5" />
      <rect width="160" height="32" fill="#c0392b" />
      <rect x="10" y="10" width="45" height="6" rx="2" fill="#fff" opacity="0.9" />
      <rect x="115" y="12" width="14" height="4" rx="2" fill="#fff" opacity="0.6" />
      <rect x="133" y="12" width="14" height="4" rx="2" fill="#fff" opacity="0.6" />
      <rect x="10" y="38" width="44" height="22" rx="3" fill="#e67e22" opacity="0.3" />
      <rect x="10" y="63" width="28" height="4" rx="1" fill="#c0392b" opacity="0.7" />
      <rect x="10" y="70" width="18" height="5" rx="2" fill="#e74c3c" />
      <rect x="60" y="38" width="44" height="22" rx="3" fill="#e67e22" opacity="0.3" />
      <rect x="60" y="63" width="28" height="4" rx="1" fill="#c0392b" opacity="0.7" />
      <rect x="60" y="70" width="18" height="5" rx="2" fill="#e74c3c" />
      <rect x="110" y="38" width="44" height="22" rx="3" fill="#e67e22" opacity="0.3" />
      <rect x="110" y="63" width="28" height="4" rx="1" fill="#c0392b" opacity="0.7" />
      <rect x="110" y="70" width="18" height="5" rx="2" fill="#e74c3c" />
    </svg>
  );

  if (id === "compacto") return (
    <svg viewBox="0 0 160 100" className="w-full rounded-md">
      <rect width="160" height="100" fill="#f7fafc" />
      <rect width="160" height="20" fill="#2d3748" />
      <rect x="8" y="6" width="40" height="5" rx="2" fill="#fff" opacity="0.8" />
      <rect x="120" y="7" width="12" height="3" rx="1" fill="#3182ce" opacity="0.9" />
      <rect x="136" y="7" width="12" height="3" rx="1" fill="#fff" opacity="0.5" />
      {[0,1,2,3,4,5,6,7].map((i) => (
        <g key={i}>
          <rect x={8 + (i % 4) * 38} y={26 + Math.floor(i / 4) * 34} width="34" height="22" rx="2" fill="#e2e8f0" />
          <rect x={8 + (i % 4) * 38} y={50 + Math.floor(i / 4) * 34} width="22" height="3" rx="1" fill="#2d3748" opacity="0.5" />
          <rect x={8 + (i % 4) * 38} y={55 + Math.floor(i / 4) * 34} width="14" height="2" rx="1" fill="#3182ce" opacity="0.6" />
        </g>
      ))}
    </svg>
  );

  if (id === "minimalista") return (
    <svg viewBox="0 0 160 100" className="w-full rounded-md">
      <rect width="160" height="100" fill="#ffffff" />
      <rect width="160" height="1" y="18" fill="#eeeeee" />
      <rect x="10" y="6" width="35" height="5" rx="1" fill="#1a1a1a" opacity="0.8" />
      <rect x="110" y="7" width="14" height="3" rx="1" fill="#888" opacity="0.5" />
      <rect x="128" y="7" width="14" height="3" rx="1" fill="#888" opacity="0.5" />
      <rect x="10" y="26" width="80" height="8" rx="1" fill="#1a1a1a" opacity="0.15" />
      <rect x="10" y="37" width="55" height="4" rx="1" fill="#888" opacity="0.3" />
      <rect x="10" y="49" width="44" height="26" rx="2" fill="#f5f5f5" />
      <rect x="10" y="78" width="28" height="3" rx="1" fill="#1a1a1a" opacity="0.5" />
      <rect x="10" y="83" width="18" height="2" rx="1" fill="#888" opacity="0.4" />
      <rect x="60" y="49" width="44" height="26" rx="2" fill="#f5f5f5" />
      <rect x="60" y="78" width="28" height="3" rx="1" fill="#1a1a1a" opacity="0.5" />
      <rect x="60" y="83" width="18" height="2" rx="1" fill="#888" opacity="0.4" />
      <rect x="110" y="49" width="44" height="26" rx="2" fill="#f5f5f5" />
      <rect x="110" y="78" width="28" height="3" rx="1" fill="#1a1a1a" opacity="0.5" />
      <rect x="110" y="83" width="18" height="2" rx="1" fill="#888" opacity="0.4" />
    </svg>
  );

  if (id === "premium") return (
    <svg viewBox="0 0 160 100" className="w-full rounded-md">
      <rect width="160" height="100" fill="#f0ede8" />
      <rect width="160" height="30" fill="#0d0d0d" />
      <rect x="10" y="10" width="45" height="6" rx="2" fill="#c5a059" />
      <rect x="112" y="12" width="14" height="3" rx="1" fill="#c5a059" opacity="0.6" />
      <rect x="130" y="12" width="14" height="3" rx="1" fill="#c5a059" opacity="0.6" />
      <rect x="10" y="38" width="44" height="28" rx="3" fill="#1a1a1a" opacity="0.12" />
      <rect x="10" y="69" width="30" height="4" rx="1" fill="#0d0d0d" opacity="0.6" />
      <rect x="10" y="75" width="20" height="4" rx="2" fill="#c5a059" />
      <rect x="60" y="38" width="44" height="28" rx="3" fill="#1a1a1a" opacity="0.12" />
      <rect x="60" y="69" width="30" height="4" rx="1" fill="#0d0d0d" opacity="0.6" />
      <rect x="60" y="75" width="20" height="4" rx="2" fill="#c5a059" />
      <rect x="110" y="38" width="44" height="28" rx="3" fill="#1a1a1a" opacity="0.12" />
      <rect x="110" y="69" width="30" height="4" rx="1" fill="#0d0d0d" opacity="0.6" />
      <rect x="110" y="75" width="20" height="4" rx="2" fill="#c5a059" />
    </svg>
  );

  return <div className="w-full aspect-video bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">Padrão</div>;
}

export default function TemplatesECoresForm() {
  const [dados, setDados] = useState<Imobiliaria | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [r1, r2] = await Promise.all([fetch("/api/imobiliaria"), fetch("/api/templates")]);
        const d1 = await r1.json().catch(() => ({}));
        if (!r1.ok) { setErroCarregamento(`Erro ${r1.status}: ${d1.erro || "Falha ao carregar."}`); return; }
        const i = d1.imobiliaria;
        setDados({
          corPrimaria: i.corPrimaria,
          corSecundaria: i.corSecundaria,
          corDestaque: i.corDestaque,
          corFundo: i.corFundo,
          fontHeading: i.fontHeading,
          fontBody: i.fontBody,
          templateId: i.templateId
        });
        const d2 = await r2.json().catch(() => ({ templates: [] }));
        if (r2.ok) setTemplates(d2.templates || []);
      } catch (e) {
        setErroCarregamento(`Erro de conexão: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    carregar();
  }, []);

  function selecionarTemplate(templateId: string | null, identificador?: string) {
    if (!dados) return;
    const preset = identificador ? PRESETS[identificador] : {};
    setDados({ ...dados, templateId, ...(preset || {}) });
  }

  async function salvar() {
    if (!dados) return;
    setSalvando(true);
    setErro(null);

    const r = await fetch("/api/imobiliaria");
    const d = await r.json();
    if (!r.ok) { setSalvando(false); setErro("Erro ao buscar dados."); return; }

    const resposta = await fetch("/api/imobiliaria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...d.imobiliaria,
        corPrimaria: dados.corPrimaria,
        corSecundaria: dados.corSecundaria,
        corDestaque: dados.corDestaque,
        corFundo: dados.corFundo,
        fontHeading: dados.fontHeading,
        fontBody: dados.fontBody,
        templateId: dados.templateId
      })
    });
    setSalvando(false);
    if (!resposta.ok) { setErro("Não foi possível salvar."); return; }
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

  if (!dados) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Templates e cores</h2>
        <p className="text-sm text-gray-500">Selecione um template — as cores e fontes são ajustadas automaticamente. Você pode personalizar depois.</p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Templates e cores salvos!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Template da vitrine</h3>
        {templates.length === 0 ? (
          <div className="border rounded-xl p-4 text-sm text-gray-500 text-center">
            <p>Nenhum template encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Acesse Plataforma → "Criar templates no banco" para instalá-los.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Opção "sem template" */}
            <label
              className={`border-2 rounded-xl p-3 cursor-pointer transition ${!dados.templateId ? "border-brand-gold" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => selecionarTemplate(null)}
            >
              <input type="radio" className="sr-only" checked={!dados.templateId} onChange={() => selecionarTemplate(null)} />
              <div className="w-full aspect-video bg-gray-100 rounded-md mb-2 flex items-center justify-center text-xs text-gray-400">Personalizado</div>
              <p className="text-sm font-medium">Personalizado</p>
              <p className="text-xs text-gray-400">Use suas próprias cores e fontes abaixo</p>
            </label>

            {templates.map((t) => (
              <label
                key={t.id}
                className={`border-2 rounded-xl p-3 cursor-pointer transition ${dados.templateId === t.id ? "border-brand-gold" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => selecionarTemplate(t.id, t.identificador)}
              >
                <input type="radio" className="sr-only" checked={dados.templateId === t.id} onChange={() => selecionarTemplate(t.id, t.identificador)} />
                <div className="mb-2">
                  <ThumbnailSVG id={t.identificador} />
                </div>
                <p className="text-sm font-medium">{t.nome}</p>
                {t.descricao && <p className="text-xs text-gray-400">{t.descricao}</p>}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Cores */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cores da marca</h3>
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

      {/* Fontes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipografia</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fonte dos títulos</label>
            <select value={dados.fontHeading} onChange={(e) => setDados({ ...dados, fontHeading: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fonte do corpo de texto</label>
            <select value={dados.fontBody} onChange={(e) => setDados({ ...dados, fontBody: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={salvar} disabled={salvando} className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm">
        {salvando ? "Salvando..." : "Salvar template e cores"}
      </button>
    </div>
  );
}
