"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BuscaImoveis from "./BuscaImoveis";

type Banner = {
  id: string;
  titulo: string | null;
  urlDesktop: string;
  urlMobile: string | null;
  link: string | null;
};

type Props = {
  banners: Banner[];
  heroTitulo?: string | null;
  heroSubtitulo?: string | null;
};

export default function HeroSlider({ banners, heroTitulo, heroSubtitulo }: Props) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const intervalo = setInterval(() => {
      setAtual((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(intervalo);
  }, [banners.length]);

  return (
    <section className="relative h-[560px] md:h-[640px] overflow-hidden bg-brand-dark">
      {banners.length > 0 ? (
        banners.map((banner, indice) => {
          const Slide = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.urlDesktop}
              alt={banner.titulo || "Banner"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          );
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                indice === atual ? "opacity-100" : "opacity-0"
              }`}
            >
              {banner.link ? <Link href={banner.link}>{Slide}</Link> : Slide}
            </div>
          );
        })
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-brand-dark to-black" />
      )}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-white text-3xl md:text-5xl font-bold max-w-3xl mb-4">
          {heroTitulo || "Encontre o imóvel ideal para você"}
        </h1>
        <p className="text-white/80 max-w-xl mb-8">
          {heroSubtitulo || "Compra, venda e locação com atendimento próximo e imóveis selecionados."}
        </p>

        <BuscaImoveis />
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
          {banners.map((_, indice) => (
            <button
              key={indice}
              onClick={() => setAtual(indice)}
              aria-label={`Ir para o slide ${indice + 1}`}
              className={`h-2 rounded-full transition-all ${
                indice === atual ? "w-8 bg-brand-goldVivid" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
