"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Grid2x2 } from "lucide-react";

type Foto = {
  id: string;
  url: string;
};

export default function GaleriaFotos({ fotos, alt }: { fotos: Foto[]; alt: string }) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [lightboxAberto, setLightboxAberto] = useState(false);

  const fotosValidas = fotos.filter((f) => f.url);

  const irPara = useCallback(
    (indice: number) => {
      if (fotosValidas.length === 0) return;
      setIndiceAtual((indice + fotosValidas.length) % fotosValidas.length);
    },
    [fotosValidas.length]
  );

  const anterior = useCallback(() => irPara(indiceAtual - 1), [indiceAtual, irPara]);
  const proxima = useCallback(() => irPara(indiceAtual + 1), [indiceAtual, irPara]);

  function abrirLightbox(indice: number) {
    setIndiceAtual(indice);
    setLightboxAberto(true);
  }

  useEffect(() => {
    if (!lightboxAberto) return;
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxAberto(false);
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    }
    window.addEventListener("keydown", aoApertarTecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoApertarTecla);
      document.body.style.overflow = "";
    };
  }, [lightboxAberto, anterior, proxima]);

  const [toqueInicialX, setToqueInicialX] = useState<number | null>(null);
  function aoTocarInicio(e: React.TouchEvent) { setToqueInicialX(e.touches[0].clientX); }
  function aoTocarFim(e: React.TouchEvent) {
    if (toqueInicialX === null) return;
    const diff = e.changedTouches[0].clientX - toqueInicialX;
    if (Math.abs(diff) > 40) diff > 0 ? anterior() : proxima();
    setToqueInicialX(null);
  }

  if (fotosValidas.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-gray-100 h-80 md:h-[420px] flex items-center justify-center text-gray-400">
        Sem fotos
      </div>
    );
  }

  // Grid: foto principal + até 4 miniaturas
  const fotoPrincipal = fotosValidas[0];
  const miniaturas = fotosValidas.slice(1, 5);
  const extras = fotosValidas.length - 5; // quantas ficam ocultas (a partir da 6ª)

  return (
    <div>
      {/* Layout grid: 4 colunas, 2 linhas */}
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-64 md:h-[400px] rounded-xl overflow-hidden">
        {/* Foto principal — 2 colunas × 2 linhas */}
        <button
          type="button"
          onClick={() => abrirLightbox(0)}
          className="col-span-2 row-span-2 relative overflow-hidden group cursor-zoom-in"
          aria-label="Ampliar foto principal"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoPrincipal.url}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </button>

        {/* Miniaturas: 2 colunas × 2 linhas (índices 0-3) */}
        {[0, 1, 2, 3].map((i) => {
          const foto = miniaturas[i];
          const isUltima = i === 3 && extras > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => foto ? abrirLightbox(i + 1) : undefined}
              className={`relative overflow-hidden group ${foto ? "cursor-zoom-in" : "bg-gray-100 cursor-default"}`}
              aria-label={foto ? `Ver foto ${i + 2}` : undefined}
            >
              {foto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt={alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {isUltima && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white pointer-events-none">
                      <Grid2x2 className="w-5 h-5 mb-1" />
                      <span className="text-sm font-semibold">+{extras + 1} ver todas</span>
                    </div>
                  )}
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Lightbox em tela cheia */}
      {lightboxAberto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxAberto(false)}
          onTouchStart={aoTocarInicio}
          onTouchEnd={aoTocarFim}
        >
          <button
            type="button"
            onClick={() => setLightboxAberto(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>

          {fotosValidas.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); anterior(); }}
                aria-label="Foto anterior"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); proxima(); }}
                aria-label="Próxima foto"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotosValidas[indiceAtual].url}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[80vh] object-contain"
          />

          {fotosValidas.length > 1 && (
            <>
              <span className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/55 text-white text-xs rounded-full px-3 py-1">
                {indiceAtual + 1} / {fotosValidas.length}
              </span>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1">
                {fotosValidas.map((foto, i) => (
                  <button
                    key={foto.id}
                    onClick={(e) => { e.stopPropagation(); irPara(i); }}
                    className={`shrink-0 w-12 h-9 rounded overflow-hidden border-2 transition ${
                      i === indiceAtual ? "border-brand-goldVivid" : "border-transparent opacity-60 hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
