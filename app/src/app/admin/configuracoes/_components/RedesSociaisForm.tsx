"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { iconeDaRedeSocial } from "@/lib/icones";

type RedeSocial = {
  id: string;
  plataforma: string;
  url: string;
  ordem: number;
};

const PLATAFORMAS = [
  { valor: "facebook", label: "Facebook" },
  { valor: "instagram", label: "Instagram" },
  { valor: "linkedin", label: "LinkedIn" },
  { valor: "youtube", label: "YouTube" },
  { valor: "tiktok", label: "TikTok" },
  { valor: "whatsapp", label: "WhatsApp" }
];

export default function RedesSociaisForm() {
  const [redes, setRedes] = useState<RedeSocial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novaPlataforma, setNovaPlataforma] = useState("instagram");
  const [novaUrl, setNovaUrl] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  async function carregar() {
    const resposta = await fetch("/api/redes-sociais");
    const data = await resposta.json().catch(() => ({ redesSociais: [] }));
    setRedes(data.redesSociais || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!novaUrl.trim()) {
      setErro("Informe a URL da rede social.");
      return;
    }
    setAdicionando(true);
    setErro(null);

    const resposta = await fetch("/api/redes-sociais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plataforma: novaPlataforma, url: novaUrl.trim() })
    });
    const data = await resposta.json().catch(() => ({}));
    setAdicionando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível adicionar.");
      return;
    }
    setNovaUrl("");
    await carregar();
  }

  async function remover(id: string) {
    setErro(null);
    const resposta = await fetch(`/api/redes-sociais/${id}`, { method: "DELETE" });
    if (!resposta.ok) {
      const data = await resposta.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível remover.");
      return;
    }
    setRedes((atual) => atual.filter((r) => r.id !== id));
  }

  async function atualizarUrl(id: string, url: string) {
    setRedes((atual) => atual.map((r) => (r.id === id ? { ...r, url } : r)));
  }

  async function salvarUrl(id: string, url: string) {
    await fetch(`/api/redes-sociais/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Redes sociais</h2>
        <p className="text-sm text-gray-500">Exibidas no cabeçalho/rodapé do site público.</p>
      </div>

      {erro && <div className="bg-red-50 text-sm text-red-600 rounded-md px-3 py-2">{erro}</div>}

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {redes.length === 0 && <p className="text-sm text-gray-400">Nenhuma rede social cadastrada ainda.</p>}
          {redes.map((rede) => {
            const Icone = iconeDaRedeSocial(rede.plataforma);
            return (
              <div key={rede.id} className="flex items-center gap-2">
                <span className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-light text-brand-dark shrink-0">
                  <Icone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={rede.url}
                  onChange={(e) => atualizarUrl(rede.id, e.target.value)}
                  onBlur={(e) => salvarUrl(rede.id, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remover(rede.id)}
                  className="text-gray-400 hover:text-red-500 p-2"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 border-t pt-4">
        <select
          value={novaPlataforma}
          onChange={(e) => setNovaPlataforma(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-2 text-sm"
        >
          {PLATAFORMAS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="https://..."
          value={novaUrl}
          onChange={(e) => setNovaUrl(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={adicionando}
          className="flex items-center gap-1 bg-brand-goldVivid text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
