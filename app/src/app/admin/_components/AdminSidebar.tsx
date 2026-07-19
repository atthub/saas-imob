"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, Menu, LayoutDashboard, Building2, Users, Briefcase,
  ClipboardList, Settings, UserCog, Contact, UploadCloud,
  FileText, ClipboardCheck, Layers, DollarSign, Megaphone,
  BookOpen, Search, ChevronRight, LucideIcon
} from "lucide-react";
import SugestaoButton from "./SugestaoButton";
import LogoutButton from "./LogoutButton";

// Ícones definidos aqui (não podem vir como prop de Server Component)
const ICONES: Record<string, LucideIcon> = {
  "/admin":                      LayoutDashboard,
  "/admin/imoveis":              Building2,
  "/admin/leads":                Users,
  "/admin/corretores":           Briefcase,
  "/admin/captacoes":            ClipboardList,
  "/admin/proprietarios":        Contact,
  "/admin/configuracoes":        Settings,
  "/admin/usuarios":             UserCog,
  "/admin/promocoes":            Megaphone,
  "/admin/blog":                 BookOpen,
  "/admin/landing-pages":        FileText,
  "/admin/comissoes":            DollarSign,
  "/admin/auditoria":            ClipboardCheck,
  "/admin/plataforma":           Layers,
  "/admin/importacao-wordpress": UploadCloud,
};

type SubMenuItem = {
  href: string;
  label: string;
};

type MenuItem = {
  href: string;
  label: string;
  subItems?: SubMenuItem[];
};

type Props = {
  menu: MenuItem[];
  nomeImobiliaria: string;
  nomeUsuario: string;
};

export default function AdminSidebar({ menu, nomeImobiliaria, nomeUsuario }: Props) {
  const [aberto, setAberto] = useState(false); // mobile drawer
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Verifica se o GRUPO está ativo (algum subitem pertence ao pathname atual).
  // Para hrefs com ?query, verifica apenas o pathname — sem SSR mismatch.
  const isGrupoAtivo = useCallback((subItems: SubMenuItem[]): boolean => {
    return subItems.some((sub) => {
      const hrefPath = sub.href.split("?")[0];
      return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    });
  }, [pathname]);

  // Verifica se um SUB-ITEM específico está ativo.
  // Para hrefs com ?query, não destaca individualmente (o título da página informa a seção).
  const isSubAtivo = useCallback((href: string): boolean => {
    if (href.includes("?")) return false; // search-param links: só o grupo pai é destacado
    return pathname === href || pathname.startsWith(href + "/");
  }, [pathname]);

  // Auto-expand seções cujo path atual está dentro delas
  useEffect(() => {
    const novasExpansoes: Record<string, boolean> = {};
    menu.forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        if (isGrupoAtivo(item.subItems)) novasExpansoes[item.href] = true;
      }
    });
    setExpandidos((prev) => ({ ...prev, ...novasExpansoes }));
  }, [pathname, menu, isGrupoAtivo]);

  // Fechar ao clicar fora (mobile)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (aberto && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [aberto]);

  // Fechar ao navegar (mobile)
  useEffect(() => { setAberto(false); }, [pathname]);

  const buscaLower = busca.toLowerCase().trim();

  // Filtra menu pela busca, expandindo grupos com matches automaticamente
  const menuFiltrado = useMemo<MenuItem[]>(() => {
    if (!buscaLower) return menu;
    return menu.flatMap((item) => {
      if (!item.subItems || item.subItems.length === 0) {
        return item.label.toLowerCase().includes(buscaLower) ? [item] : [];
      }
      const paiMatch = item.label.toLowerCase().includes(buscaLower);
      const subsFiltrados = item.subItems.filter((s) =>
        s.label.toLowerCase().includes(buscaLower)
      );
      if (paiMatch) return [item]; // pai encontrado: exibe todos os subitens
      if (subsFiltrados.length > 0) return [{ ...item, subItems: subsFiltrados }];
      return [];
    });
  }, [menu, buscaLower]);

  function toggleExpandido(href: string) {
    setExpandidos((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  const sidebarContent = (
    <>
      {/* Logo + identidade */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://imob.attitudehub.com.br/logo-vitrine-imob.png"
          alt="Vitrine Imob"
          className="h-10 w-auto"
        />
        <p className="font-heading text-brand-gold font-bold text-xs leading-tight text-center">
          {nomeImobiliaria}
        </p>
        <Link
          href="/admin/conta"
          className="text-xs text-white/50 hover:text-white/80 transition block text-center"
        >
          {nomeUsuario}
        </Link>
      </div>

      {/* Campo de busca */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Localizar função..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-white/10 text-white placeholder-white/40 rounded-md border border-white/10 focus:outline-none focus:border-white/30 focus:bg-white/15 transition"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {menuFiltrado.map((item) => {
          const Icone = ICONES[item.href] || LayoutDashboard;

          if (item.subItems && item.subItems.length > 0) {
            // Com busca ativa: forçar expansão de grupos com resultados
            const forcarExpansao = buscaLower.length > 0;
            const estaExpandido = forcarExpansao || (expandidos[item.href] ?? false);

            const temSubAtivo = isGrupoAtivo(item.subItems);

            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => !forcarExpansao && toggleExpandido(item.href)}
                  className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    temSubAtivo
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icone size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 text-white/40 transition-transform ${
                      estaExpandido ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {estaExpandido && (
                  <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-white/10 pl-2">
                    {item.subItems.map((sub) => {
                      const subAtivo = isSubAtivo(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${
                            subAtivo
                              ? "bg-white/15 text-white font-medium"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item plano (sem submenus)
          const ativo =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                ativo
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icone size={17} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Sem resultados na busca */}
        {buscaLower && menuFiltrado.length === 0 && (
          <p className="text-xs text-white/30 px-3 py-4 text-center">
            Nenhuma função encontrada
          </p>
        )}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0 space-y-1">
        <SugestaoButton />
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Botão hamburger — só mobile */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-brand-dark text-white shadow-md"
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {aberto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
      )}

      {/* Sidebar desktop — sempre visível */}
      <aside className="hidden lg:flex w-60 bg-brand-dark text-white flex-col h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile — slide-in */}
      <div
        ref={sidebarRef}
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-brand-dark text-white flex flex-col z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          className="absolute top-3 right-3 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </div>
    </>
  );
}
