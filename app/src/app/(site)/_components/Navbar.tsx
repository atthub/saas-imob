"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Tag, Key, Building2, ClipboardList, Menu, X, Heart, Calculator, Megaphone, BookOpen } from "lucide-react";
import { useFavoritos } from "./FavoritosContext";

type Props = {
  imobiliaria: {
    nome: string;
    logoUrl?: string | null;
    logoAltura?: number | null;
  } | null;
  temPromocoesAtivas?: boolean;
  mcmvHabilitado?: boolean;
  blogMenuHabilitado?: boolean;
};

const LINKS_BASE = [
  { href: "/", label: "Início", Icone: Home, sempre: true },
  { href: "/imoveis?finalidade=VENDA", label: "Comprar", Icone: Tag, sempre: true },
  { href: "/imoveis?finalidade=LOCACAO", label: "Alugar", Icone: Key, sempre: true },
  { href: "/imoveis", label: "Todos os imóveis", Icone: Building2, sempre: true },
  { href: "/promocoes", label: "Promoções", Icone: Megaphone, sempre: false, flag: "promocoes" },
  { href: "/blog", label: "Blog", Icone: BookOpen, sempre: false, flag: "blog" },
  { href: "/simulador-mcmv", label: "Simular MCMV", Icone: Calculator, sempre: false, flag: "mcmv" },
  { href: "/captacao", label: "Anuncie seu imóvel", Icone: ClipboardList, sempre: true },
];

function BadgeFavoritos() {
  const { totalFavoritos } = useFavoritos();
  if (totalFavoritos === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
      {totalFavoritos > 9 ? "9+" : totalFavoritos}
    </span>
  );
}

export default function Navbar({ imobiliaria, temPromocoesAtivas = false, mcmvHabilitado = false, blogMenuHabilitado = true }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);

  const LINKS = LINKS_BASE.filter((l) => {
    if (l.sempre) return true;
    if (l.flag === "promocoes") return temPromocoesAtivas;
    if (l.flag === "mcmv") return mcmvHabilitado;
    if (l.flag === "blog") return blogMenuHabilitado;
    return true;
  });

  // Hard navigation para /imoveis — evita Router Cache do Next.js
  // que serve dados stale com router.push mesmo com force-dynamic.
  function navImoveis(href: string) {
    window.location.href = href;
  }

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-2 min-h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuAberto(false)}>
          {imobiliaria?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imobiliaria.logoUrl}
              alt={imobiliaria.nome}
              style={{ height: imobiliaria.logoAltura || 48, maxHeight: 140 }}
              className="w-auto object-contain"
            />
          ) : (
            <span className="font-heading text-xl font-bold text-brand-dark">
              {imobiliaria?.nome || "Vitrine Imobiliária"}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-dark">
          {LINKS.map(({ href, label, Icone }) =>
            href.startsWith("/imoveis") ? (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); navImoveis(href); }}
                className="flex items-center gap-1.5 hover:text-brand-goldVivid transition cursor-pointer"
              >
                <Icone className="w-4 h-4" /> {label}
              </a>
            ) : (
              <Link key={href} href={href} className="flex items-center gap-1.5 hover:text-brand-goldVivid transition">
                <Icone className="w-4 h-4" /> {label}
              </Link>
            )
          )}
          <Link
            href="/favoritos"
            className="relative flex items-center gap-1.5 hover:text-brand-goldVivid transition"
            aria-label="Meus favoritos"
          >
            <Heart className="w-4 h-4" />
            <span>Favoritos</span>
            <BadgeFavoritos />
          </Link>
        </nav>

        <button
          type="button"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuAberto((aberto) => !aberto)}
          className="md:hidden flex items-center justify-center w-10 h-10 text-brand-dark"
        >
          {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuAberto && (
        <nav className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-1 text-sm font-medium text-brand-dark">
          {LINKS.map(({ href, label, Icone }) =>
            href.startsWith("/imoveis") ? (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); setMenuAberto(false); navImoveis(href); }}
                className="flex items-center gap-2 py-2.5 px-1 hover:text-brand-goldVivid transition border-b last:border-b-0 cursor-pointer"
              >
                <Icone className="w-4 h-4" /> {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-2 py-2.5 px-1 hover:text-brand-goldVivid transition border-b last:border-b-0"
              >
                <Icone className="w-4 h-4" /> {label}
              </Link>
            )
          )}
          <Link
            href="/favoritos"
            onClick={() => setMenuAberto(false)}
            className="flex items-center gap-2 py-2.5 px-1 hover:text-brand-goldVivid transition border-b"
          >
            <Heart className="w-4 h-4" /> Favoritos
          </Link>
        </nav>
      )}
    </header>
  );
}
