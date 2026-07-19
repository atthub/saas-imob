"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

export default function BannerUploadForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!arquivo) {
      setErro("Selecione uma imagem para o banner.");
      return;
    }

    setEnviando(true);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const respostaUpload = await fetch("/api/upload/banner", { method: "POST", body: formData });
    const dataUpload = await respostaUpload.json().catch(() => ({}));

    if (!respostaUpload.ok) {
      setEnviando(false);
      setErro(dataUpload.erro || "Não foi possível enviar a imagem.");
      return;
    }

    const respostaBanner = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, link, urlDesktop: dataUpload.url, ordem: 0, ativo: true })
    });
    const dataBanner = await respostaBanner.json().catch(() => ({}));
    setEnviando(false);

    if (!respostaBanner.ok) {
      setErro(dataBanner.erro || "Não foi possível salvar o banner.");
      return;
    }

    setSucesso(true);
    setTitulo("");
    setLink("");
    setArquivo(null);
    (document.getElementById("banner-arquivo") as HTMLInputElement | null)?.value &&
      ((document.getElementById("banner-arquivo") as HTMLInputElement).value = "");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="bg-white rounded-xl shadow-sm border p-5 space-y-4 max-w-lg">
      <ModalSucesso aberto={sucesso} mensagem="Banner adicionado com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do banner</label>
        <input
          id="banner-arquivo"
          type="file"
          accept="image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
          className="text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título / legenda (opcional)</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link ao clicar (opcional)</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/imoveis ou https://..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md px-5 py-2 text-sm transition disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Adicionar banner"}
      </button>
    </form>
  );
}
