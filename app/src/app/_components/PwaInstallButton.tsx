"use client";
import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type Plataforma = "android-chrome" | "ios" | "desktop" | null;

interface Props {
  variant?: "topbar" | "admin";
}

export default function PwaInstallButton({ variant = "topbar" }: Props) {
  const [plataforma, setPlataforma] = useState<Plataforma>(null);
  const [promptEvento, setPromptEvento] = useState<Event & { prompt: () => void } | null>(null);
  const [mostrarDica, setMostrarDica] = useState(false);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    // Já instalado como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalado(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      setPlataforma("ios");
    } else if (isAndroid) {
      setPlataforma("android-chrome");
    } else {
      setPlataforma("desktop");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvento(e as Event & { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (instalado || !plataforma) return null;

  // iOS: instruções manuais
  if (plataforma === "ios") {
    return (
      <div className="relative">
        <button
          onClick={() => setMostrarDica(!mostrarDica)}
          className={
            variant === "admin"
              ? "flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-goldVivid px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              : "flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
          }
          title="Instalar app"
        >
          <Share size={14} />
          <span className="hidden sm:inline">Instalar app</span>
        </button>
        {mostrarDica && (
          <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 text-xs text-gray-700">
            <p className="font-semibold mb-1">Instalar no iPhone/iPad:</p>
            <p>1. Toque em <strong>Compartilhar</strong> (ícone 🔼 no Safari)</p>
            <p>2. Selecione <strong>"Adicionar à Tela de Início"</strong></p>
            <button onClick={() => setMostrarDica(false)} className="mt-2 text-gray-400 hover:text-gray-600">Fechar</button>
          </div>
        )}
      </div>
    );
  }

  // Android / Desktop com beforeinstallprompt
  if (promptEvento) {
    return (
      <button
        onClick={() => promptEvento.prompt()}
        className={
          variant === "admin"
            ? "flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-goldVivid px-2 py-1 rounded-lg hover:bg-gray-100 transition"
            : "flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
        }
        title="Instalar app"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Instalar app</span>
      </button>
    );
  }

  return null;
}
