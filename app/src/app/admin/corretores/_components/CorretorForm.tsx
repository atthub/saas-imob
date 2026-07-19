"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

type Props = {
  modo: "criar" | "editar";
  corretorId?: string;
  valoresIniciais?: {
    nome: string;
    telefone: string;
    whatsapp?: string;
    email?: string;
    creci?: string;
    ativo: boolean;
  };
};

export default function CorretorForm({ modo, corretorId, valoresIniciais }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(valoresIniciais?.nome || "");
  const [telefone, setTelefone] = useState(valoresIniciais?.telefone || "");
  const [whatsapp, setWhatsapp] = useState(valoresIniciais?.whatsapp || "");
  const [email, setEmail] = useState(valoresIniciais?.email || "");
  const [creci, setCreci] = useState(valoresIniciais?.creci || "");
  const [ativo, setAtivo] = useState(valoresIniciais?.ativo ?? true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const url = modo === "criar" ? "/api/corretores" : `/api/corretores/${corretorId}`;
    const method = modo === "criar" ? "POST" : "PUT";

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone, whatsapp, email, creci, ativo })
    });

    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível salvar o corretor.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/admin/corretores"), 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5 max-w-lg">
      <ModalSucesso aberto={sucesso} mensagem="Corretor salvo com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (opcional)</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (opcional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CRECI (opcional)</label>
        <input
          value={creci}
          onChange={(e) => setCreci(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Corretor ativo (disponível para receber leads)
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-brand-goldVivid hover:opacity-90 text-white font-semibold rounded-md py-2 transition disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
