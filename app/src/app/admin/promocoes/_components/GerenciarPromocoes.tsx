"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2, Plus, X, Check, ToggleLeft, ToggleRight, Upload, Megaphone } from "lucide-react";

type TipoLink = "imovel" | "externo" | null;

type Promocao = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  imagemUrlMobile: string | null;
  tipoLink: TipoLink;
  codigoImovel: string | null;
  link: string | null;
  captarLeads: boolean;
  ordem: number;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
};

type FormState = Omit<Promocao, "id">;

const VAZIO: FormState = {
  titulo: "", subtitulo: "", descricao: "",
  imagemUrl: "", imagemUrlMobile: "",
  tipoLink: null, codigoImovel: "", link: "",
  captarLeads: false, ordem: 0, ativo: true,
  dataInicio: "", dataFim: ""
};

function ImagemUpload({
  label,
  hint,
  url,
  onUrl,
  uploadTipo,
}: {
  label: string;
  hint: string;
  url: string;
  onUrl: (url: string) => void;
  uploadTipo: "desktop" | "mobile";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);
    setErroUpload(null);
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    const r = await fetch(`/api/upload/promocao?tipo=${uploadTipo}`, { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setEnviando(false);
    if (r.ok && d.url) {
      onUrl(d.url);
    } else {
      setErroUpload(d.erro || "Erro no upload.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 font-normal">({hint})</span>
      </label>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          placeholder="https://... ou faça upload ao lado"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="flex items-center gap-1.5 border border-gray-300 px-3 py-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          {enviando ? "Enviando..." : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleArquivo} />
      </div>
      {erroUpload && <p className="text-xs text-red-600 mt-1">{erroUpload}</p>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="preview" className="mt-2 h-20 w-auto rounded-md object-cover border" />
      )}
    </div>
  );
}

export default function GerenciarPromocoes({ inicial }: { inicial: Promocao[] }) {
  const [lista, setLista] = useState<Promocao[]>(inicial);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [abrirForm, setAbrirForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirNovo() {
    setForm(VAZIO);
    setEditandoId(null);
    setAbrirForm(true);
    setErro(null);
  }

  function abrirEditar(p: Promocao) {
    setForm({
      titulo: p.titulo,
      subtitulo: p.subtitulo || "",
      descricao: p.descricao || "",
      imagemUrl: p.imagemUrl || "",
      imagemUrlMobile: p.imagemUrlMobile || "",
      tipoLink: p.tipoLink,
      codigoImovel: p.codigoImovel || "",
      link: p.link || "",
      captarLeads: p.captarLeads,
      ordem: p.ordem,
      ativo: p.ativo,
      dataInicio: p.dataInicio ? p.dataInicio.slice(0, 10) : "",
      dataFim: p.dataFim ? p.dataFim.slice(0, 10) : ""
    });
    setEditandoId(p.id);
    setAbrirForm(true);
    setErro(null);
  }

  function fechar() { setAbrirForm(false); setEditandoId(null); setErro(null); }

  async function salvar() {
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setSalvando(true);
    setErro(null);

    const payload = {
      ...form,
      dataInicio: form.dataInicio || null,
      dataFim: form.dataFim || null,
      subtitulo: form.subtitulo || null,
      descricao: form.descricao || null,
      imagemUrl: form.imagemUrl || null,
      imagemUrlMobile: form.imagemUrlMobile || null,
      codigoImovel: form.tipoLink === "imovel" ? (form.codigoImovel || null) : null,
      link: form.tipoLink === "externo" ? (form.link || null) : null,
      tipoLink: form.tipoLink || null,
    };

    const url = editandoId ? `/api/admin/promocoes/${editandoId}` : "/api/admin/promocoes";
    const method = editandoId ? "PUT" : "POST";

    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    setSalvando(false);

    if (!r.ok) { setErro(d.erro || "Erro ao salvar."); return; }

    const rl = await fetch("/api/admin/promocoes");
    const dl = await rl.json().catch(() => ({ promocoes: [] }));
    setLista(dl.promocoes || []);
    fechar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta promoção?")) return;
    await fetch(`/api/admin/promocoes/${id}`, { method: "DELETE" });
    setLista((l) => l.filter((p) => p.id !== id));
  }

  async function toggleAtivo(p: Promocao) {
    await fetch(`/api/admin/promocoes/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, ativo: !p.ativo })
    });
    setLista((l) => l.map((x) => x.id === p.id ? { ...x, ativo: !x.ativo } : x));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{lista.length} promoção(ões) cadastrada(s)</p>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Nova promoção
        </button>
      </div>

      {/* Formulário inline */}
      {abrirForm && (
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-brand-gold space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-brand-dark">{editandoId ? "Editar promoção" : "Nova promoção"}</h3>
            <button onClick={fechar} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Título e subtítulo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
              <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex: Feirão de Julho" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Subtítulo</label>
              <input value={form.subtitulo || ""} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex: Condições especiais até 31/07" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={3} value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none" placeholder="Detalhes da promoção..." />
            </div>

            {/* Imagens */}
            <div className="sm:col-span-2 border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Imagens</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <ImagemUpload
                  label="Imagem Desktop"
                  hint="1200×600px recomendado"
                  url={form.imagemUrl || ""}
                  onUrl={(url) => setForm({ ...form, imagemUrl: url })}
                  uploadTipo="desktop"
                />
                <ImagemUpload
                  label="Imagem Mobile"
                  hint="800×400px recomendado"
                  url={form.imagemUrlMobile || ""}
                  onUrl={(url) => setForm({ ...form, imagemUrlMobile: url })}
                  uploadTipo="mobile"
                />
              </div>
            </div>

            {/* Tipo de link */}
            <div className="sm:col-span-2 border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Link da promoção</p>
              <div className="flex gap-3 mb-3 flex-wrap">
                {(["imovel", "externo", null] as const).map((tipo) => (
                  <button
                    key={String(tipo)}
                    type="button"
                    onClick={() => setForm({ ...form, tipoLink: tipo })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      form.tipoLink === tipo
                        ? "border-brand-gold bg-brand-gold/10 text-brand-dark"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {tipo === "imovel" ? "Imóvel por código" : tipo === "externo" ? "Link externo" : "Sem link"}
                  </button>
                ))}
              </div>

              {form.tipoLink === "imovel" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código do imóvel</label>
                  <input
                    value={form.codigoImovel || ""}
                    onChange={(e) => setForm({ ...form, codigoImovel: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Ex: IM-001"
                  />
                  <p className="text-xs text-gray-400 mt-1">O visitante será direcionado para a busca desse imóvel.</p>
                </div>
              )}

              {form.tipoLink === "externo" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL externa</label>
                  <input
                    value={form.link || ""}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Ex: /imoveis?finalidade=VENDA ou https://..."
                  />
                </div>
              )}
            </div>

            {/* Captação de leads */}
            <div className="sm:col-span-2 border-t pt-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, captarLeads: !form.captarLeads })}
                  className={`mt-0.5 transition ${form.captarLeads ? "text-brand-goldVivid" : "text-gray-300"}`}
                >
                  {form.captarLeads ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Habilitar captação de leads</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Exibe um formulário de contato na página pública desta promoção. Os leads chegam identificados com o nome da promoção.
                  </p>
                </div>
              </div>
            </div>

            {/* Datas e ordem */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data início</label>
              <input type="date" value={form.dataInicio || ""} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data fim</label>
              <input type="date" value={form.dataFim || ""} onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ordem</label>
              <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="text-xs font-medium text-gray-700">Ativa</label>
              <button type="button" onClick={() => setForm({ ...form, ativo: !form.ativo })}
                className={`transition ${form.ativo ? "text-brand-goldVivid" : "text-gray-300"}`}>
                {form.ativo ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button onClick={salvar} disabled={salvando}
              className="flex items-center gap-2 bg-brand-goldVivid text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60 transition">
              <Check className="w-4 h-4" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={fechar} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma promoção cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 flex gap-4 items-start ${!p.ativo ? "opacity-60" : ""}`}>
              {p.imagemUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagemUrl} alt={p.titulo} className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-brand-dark text-sm">{p.titulo}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.ativo ? "Ativa" : "Inativa"}
                  </span>
                  {p.captarLeads && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                      Captura leads
                    </span>
                  )}
                  {p.tipoLink === "imovel" && p.codigoImovel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Imóvel: {p.codigoImovel}
                    </span>
                  )}
                </div>
                {p.subtitulo && <p className="text-xs text-gray-500 mt-0.5">{p.subtitulo}</p>}
                {(p.dataInicio || p.dataFim) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {p.dataInicio ? new Date(p.dataInicio).toLocaleDateString("pt-BR") : "—"} até {p.dataFim ? new Date(p.dataFim).toLocaleDateString("pt-BR") : "sem fim"}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleAtivo(p)} title={p.ativo ? "Desativar" : "Ativar"}
                  className={`p-2 rounded-md transition ${p.ativo ? "text-brand-goldVivid hover:bg-brand-gold/10" : "text-gray-400 hover:bg-gray-100"}`}>
                  {p.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => abrirEditar(p)} title="Editar"
                  className="p-2 rounded-md text-blue-500 hover:bg-blue-50 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => excluir(p.id)} title="Excluir"
                  className="p-2 rounded-md text-red-400 hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
