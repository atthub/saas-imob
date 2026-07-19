"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, GripVertical, ExternalLink } from "lucide-react";
import ModalSucesso from "../../_components/ModalSucesso";

type Banner = {
  id: string;
  titulo: string | null;
  urlDesktop: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
};

export default function BannersConfigForm() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [titulo, setTitulo] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const carregar = useCallback(async () => {
    const r = await fetch("/api/banners");
    const d = await r.json();
    if (r.ok) setBanners(d.banners || []);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!arquivo) { setErro("Selecione uma imagem."); return; }
    setEnviando(true);

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    const r1 = await fetch("/api/upload/banner", { method: "POST", body: formData });
    const d1 = await r1.json();
    if (!r1.ok) { setEnviando(false); setErro(d1.erro || "Erro ao enviar imagem."); return; }

    const r2 = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: titulo || null, urlDesktop: d1.url, link: link || null })
    });
    const d2 = await r2.json();
    setEnviando(false);
    if (!r2.ok) { setErro(d2.erro || "Erro ao salvar banner."); return; }

    setTitulo(""); setLink(""); setArquivo(null);
    setSucesso(true);
    await carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este banner?")) return;
    setExcluindo(id);
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setExcluindo(null);
    await carregar();
  }

  async function toggleAtivo(banner: Banner) {
    await fetch(`/api/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !banner.ativo, urlDesktop: banner.urlDesktop })
    });
    await carregar();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Banners</h2>
        <p className="text-sm text-gray-500">Banners rotativos exibidos no topo da vitrine pública.</p>
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Banner adicionado com sucesso!" onClose={() => setSucesso(false)} />

      {/* Lista de banners existentes */}
      {banners.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="divide-y">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3">
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.urlDesktop} alt={b.titulo || "Banner"} className="w-24 h-14 object-cover rounded-md border shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark truncate">{b.titulo || <span className="text-gray-400">Sem título</span>}</p>
                  {b.link && (
                    <a href={b.link} target="_blank" rel="noreferrer" className="text-xs text-brand-gold flex items-center gap-1 hover:underline">
                      <ExternalLink size={11} />{b.link.slice(0, 40)}…
                    </a>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 cursor-pointer">
                  <input type="checkbox" checked={b.ativo} onChange={() => toggleAtivo(b)} className="accent-brand-gold" />
                  Ativo
                </label>
                <button
                  onClick={() => excluir(b.id)}
                  disabled={excluindo === b.id}
                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {banners.length === 0 && (
        <p className="text-sm text-gray-400 text-center border border-dashed rounded-xl py-6">Nenhum banner cadastrado ainda.</p>
      )}

      {/* Formulário de upload */}
      <form onSubmit={enviar} className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Adicionar novo banner</h3>
        {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do banner *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Recomendado: 1920×600px, formato JPG ou PNG.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Promoção de verão" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link ao clicar (opcional)</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" disabled={enviando} className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm">
          {enviando ? "Enviando..." : "+ Adicionar banner"}
        </button>
      </form>
    </div>
  );
}
