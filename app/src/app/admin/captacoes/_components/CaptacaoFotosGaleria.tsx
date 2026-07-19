"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";

type Foto = {
  id: string;
  url: string;
};

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "captacao";
}

function nomeArquivoDaFoto(url: string, indice: number) {
  const partes = url.split("/");
  const original = partes[partes.length - 1] || `foto-${indice + 1}.jpg`;
  return original;
}

export default function CaptacaoFotosGaleria({
  fotos,
  nomeProprietario
}: {
  fotos: Foto[];
  nomeProprietario: string;
}) {
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null);
  const [baixandoZip, setBaixandoZip] = useState(false);
  const [erroZip, setErroZip] = useState<string | null>(null);

  const irPara = useCallback(
    (indice: number) => {
      if (fotos.length === 0) return;
      setIndiceAberto((indice + fotos.length) % fotos.length);
    },
    [fotos.length]
  );

  const anterior = useCallback(() => {
    if (indiceAberto === null) return;
    irPara(indiceAberto - 1);
  }, [indiceAberto, irPara]);

  const proxima = useCallback(() => {
    if (indiceAberto === null) return;
    irPara(indiceAberto + 1);
  }, [indiceAberto, irPara]);

  useEffect(() => {
    if (indiceAberto === null) return;
    function aoApertarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setIndiceAberto(null);
      if (evento.key === "ArrowLeft") anterior();
      if (evento.key === "ArrowRight") proxima();
    }
    window.addEventListener("keydown", aoApertarTecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoApertarTecla);
      document.body.style.overflow = "";
    };
  }, [indiceAberto, anterior, proxima]);

  async function baixarUmaFoto(url: string, nomeArquivo: string) {
    const resposta = await fetch(url);
    const blob = await resposta.blob();
    const urlObjeto = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = urlObjeto;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(urlObjeto);
  }

  async function baixarTodasComoZip() {
    setErroZip(null);
    setBaixandoZip(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        fotos.map(async (foto, indice) => {
          const resposta = await fetch(foto.url);
          const blob = await resposta.blob();
          zip.file(nomeArquivoDaFoto(foto.url, indice), blob);
        })
      );

      const conteudoZip = await zip.generateAsync({ type: "blob" });
      const urlObjeto = URL.createObjectURL(conteudoZip);
      const link = document.createElement("a");
      link.href = urlObjeto;
      link.download = `captacao-${slugify(nomeProprietario)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(urlObjeto);
    } catch {
      setErroZip("Não foi possível gerar o .zip. Tente novamente.");
    } finally {
      setBaixandoZip(false);
    }
  }

  if (fotos.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{fotos.length} foto(s) enviada(s)</span>
        <button
          type="button"
          onClick={baixarTodasComoZip}
          disabled={baixandoZip}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-dark border border-gray-300 rounded-md px-2.5 py-1 hover:bg-gray-50 disabled:opacity-60"
        >
          {baixandoZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {baixandoZip ? "Gerando .zip..." : "Baixar todas (.zip)"}
        </button>
      </div>
      {erroZip && <p className="text-xs text-red-600 mb-2">{erroZip}</p>}

      <div className="flex flex-wrap gap-2">
        {fotos.map((foto, indice) => (
          <div key={foto.id} className="relative group">
            <button
              type="button"
              onClick={() => setIndiceAberto(indice)}
              className="block w-20 h-20 rounded-md border overflow-hidden cursor-zoom-in"
              aria-label="Ampliar foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt="Foto do imóvel enviada" className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => baixarUmaFoto(foto.url, nomeArquivoDaFoto(foto.url, indice))}
              aria-label="Baixar esta foto"
              title="Baixar esta foto"
              className="absolute top-1 right-1 bg-black/55 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {indiceAberto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIndiceAberto(null)}
        >
          <button
            type="button"
            onClick={() => setIndiceAberto(null)}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              baixarUmaFoto(fotos[indiceAberto].url, nomeArquivoDaFoto(fotos[indiceAberto].url, indiceAberto));
            }}
            aria-label="Baixar esta foto"
            className="absolute top-4 left-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 flex items-center gap-2 text-sm px-3"
          >
            <Download className="w-5 h-5" /> Baixar
          </button>

          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(evento) => {
                  evento.stopPropagation();
                  anterior();
                }}
                aria-label="Foto anterior"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(evento) => {
                  evento.stopPropagation();
                  proxima();
                }}
                aria-label="Próxima foto"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[indiceAberto].url}
            alt="Foto do imóvel enviada"
            onClick={(evento) => evento.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] object-contain"
          />

          {fotos.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/55 text-white text-xs rounded-full px-3 py-1">
              {indiceAberto + 1} / {fotos.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
