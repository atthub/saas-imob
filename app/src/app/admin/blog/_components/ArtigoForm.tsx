"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalSucesso from "../../_components/ModalSucesso";

type Artigo = {
  id?: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemCapaUrl: string;
  categoria: string;
  autor: string;
  publicadoEm: string;
  ativo: boolean;
  metaDescricao: string;
};

function gerarSlug(titulo: string) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export default function ArtigoForm({ artigo }: { artigo?: Artigo }) {
  const router = useRouter();
  const [form, setForm] = useState<Artigo>(artigo ?? {
    titulo: "", slug: "", resumo: "", conteudo: "",
    imagemCapaUrl: "", categoria: "", autor: "",
    publicadoEm: new Date().toISOString().slice(0, 16),
    ativo: true, metaDescricao: ""
  });
  const [slugManual, setSlugManual] = useState(!!artigo?.slug);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function onTituloChange(titulo: string) {
    setForm((f) => ({ ...f, titulo, slug: slugManual ? f.slug : gerarSlug(titulo) }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro("Título obrigatório."); return; }
    setSalvando(true);
    setErro(null);

    const url = artigo?.id ? `/api/admin/artigos/${artigo.id}` : "/api/admin/artigos";
    const method = artigo?.id ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        resumo: form.resumo || null,
        imagemCapaUrl: form.imagemCapaUrl || null,
        categoria: form.categoria || null,
        autor: form.autor || null,
        metaDescricao: form.metaDescricao || null,
      })
    });
    const d = await r.json().catch(() => ({}));
    setSalvando(false);

    if (!r.ok) { setErro(d.erro || "Erro ao salvar."); return; }
    setSucesso(true);
    setTimeout(() => router.push("/admin/blog"), 1200);
  }

  return (
    <form onSubmit={salvar} className="space-y-6 max-w-3xl">
      <ModalSucesso aberto={sucesso} mensagem="Artigo salvo com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

      {/* Título + Slug */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Identificação</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
          <input value={form.titulo} onChange={(e) => onTituloChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex: Como escolher o imóvel ideal" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Slug (URL) — <span className="text-gray-400 font-normal">/blog/<strong>{form.slug || "meu-artigo"}</strong></span>
          </label>
          <input
            value={form.slug}
            onChange={(e) => { setSlugManual(true); setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }); }}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="como-escolher-imovel-ideal"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex: Dicas, Mercado, Financiamento" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Autor</label>
            <input value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Nome do autor" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de publicação</label>
          <input type="datetime-local" value={form.publicadoEm.slice(0, 16)}
            onChange={(e) => setForm({ ...form, publicadoEm: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Capa e resumo */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Capa e resumo</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL da imagem de capa</label>
          <input value={form.imagemCapaUrl} onChange={(e) => setForm({ ...form, imagemCapaUrl: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
          {form.imagemCapaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imagemCapaUrl} alt="capa" className="mt-2 h-32 w-full object-cover rounded-lg" />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Resumo (exibido na listagem)</label>
          <textarea rows={3} value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
            placeholder="Breve descrição para aparecer na listagem do blog..." />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-dark">Conteúdo do artigo</h2>
          <span className="text-xs text-gray-400">Suporta HTML básico (&lt;b&gt;, &lt;i&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;a&gt;)</span>
        </div>
        <textarea
          rows={18}
          value={form.conteudo}
          onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm font-mono resize-y"
          placeholder="<p>Conteúdo do artigo aqui...</p>"
        />
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">SEO</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Meta description <span className="text-gray-400 font-normal">({form.metaDescricao.length}/160 caracteres)</span>
          </label>
          <textarea rows={2} maxLength={160} value={form.metaDescricao}
            onChange={(e) => setForm({ ...form, metaDescricao: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
            placeholder="Resumo para mecanismos de busca (Google)..." />
        </div>
        <p className="text-xs text-gray-400">
          A imagem Open Graph (compartilhamento em redes sociais) será a mesma da capa do artigo.
        </p>
      </div>

      {/* Status + Salvar */}
      <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="w-4 h-4 accent-brand-goldVivid" />
          <span className="text-sm font-medium text-gray-700">{form.ativo ? "Publicado" : "Rascunho (não aparece no site)"}</span>
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push("/admin/blog")}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancelar</button>
          <button type="submit" disabled={salvando}
            className="bg-brand-goldVivid text-white text-sm font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 transition">
            {salvando ? "Salvando..." : "Salvar artigo"}
          </button>
        </div>
      </div>
    </form>
  );
}
