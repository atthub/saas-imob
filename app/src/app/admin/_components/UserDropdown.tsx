"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, User, Lock, LogOut } from "lucide-react";

interface Props {
  nome: string;
  iniciais: string;
}

export default function UserDropdown({ nome, iniciais }: Props) {
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition text-sm"
      >
        <span className="w-8 h-8 rounded-full bg-brand-dark text-white text-xs font-bold flex items-center justify-center shrink-0">
          {iniciais}
        </span>
        <span className="text-gray-700 hidden sm:block">{nome}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-xl shadow-lg py-1 z-50">
          <Link
            href="/admin/conta"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User size={15} />
            Minha conta
          </Link>
          <Link
            href="/admin/conta"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Lock size={15} />
            Alterar senha
          </Link>
          <div className="border-t my-1" />
          <button
            type="button"
            disabled={saindo}
            onClick={async () => {
              setSaindo(true);
              try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
              window.location.href = "/admin/login";
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
          >
            <LogOut size={15} />
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
