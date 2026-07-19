"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalSucesso from "../../../_components/ModalSucesso";
import { ExternalLink } from "lucide-react";

interface Props {
  landingPage: {
    id: string;
    slug: string;
    titulo: string | null;
    descricao: string | null;
    cta: string | null;
    status: string;
  };
}

export default function EditarLandingPageForm({ landingPage }: Props) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(landingPage.titulo || "");
  const [descricao, setDescricao] = useState(landingPage.descricao || "");
  const [cta, setCta] = useState(landingPage.cta || "");
  const [status, setStatus] = useState(landingPage.status);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function salvar() {
    setSalvando(true);
    setErro(null);

    const resposta = await fetch(`/api/landing-pages/${landingPage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, cta, status })
    });

    setSalvando(false);
    if (!resposta.ok) {
      const d = await resposta.json().catch(() => ({}));
      setErro(d.erro || "Não foi possível salvar.");
      return;
    }
    setSucesso(true);
    router.refresh();
  }

  const urlPublica = typeof window !== "undefined"
    ? `${window.location.origin}/lp/${landingPage.slug}`
    : `/lp/${landingPage.slug}`;

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-5">
      <ModalSucesso aberto={sucesso} mensagem="Landing page salva com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* URL pública */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 font-mono truncate">{urlPublica}</span>
        {status === "publicada" && (
          <a href={urlPublica} target="_blank" rel="noreferrer" className="shrink-0 text-brand-gold hover:text-brand-dark transition">
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="rascunho">Rascunho</option>
          <option value="publicada">Publicada</option>
        </select>
      </div>

      {/* Título personalizado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título personalizado (opcional)</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Deixe vazio para usar o título do imóvel"
          maxLength={255}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* Descrição personalizada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição personalizada (opcional)</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Deixe vazio para usar a descrição do imóvel"
          rows={5}
          maxLength={5000}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* CTA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Texto do botão de contato</label>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="Ex.: Quero saber mais, Agendar visita..."
          maxLength={100}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
        >
          {salvando ? "Salvando..." : "Salvar landing page"}
        </button>
      </div>
    </div>
  );
}
