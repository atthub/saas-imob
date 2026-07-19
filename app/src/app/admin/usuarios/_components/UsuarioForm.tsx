"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalSucesso from "../../_components/ModalSucesso";

const MODULOS = [
  { chave: "imoveis", label: "Imóveis" },
  { chave: "leads", label: "Leads" },
  { chave: "corretores", label: "Corretores" },
  { chave: "captacoes", label: "Captação de Imóveis" },
  { chave: "proprietarios", label: "Proprietários" },
  { chave: "banners", label: "Banners" },
  { chave: "configuracoes", label: "Configurações" },
  { chave: "usuarios", label: "Usuários" }
];

type Props = {
  modo: "criar" | "editar";
  usuarioId?: string;
  valoresIniciais?: {
    nome: string;
    email?: string;
    papel: "ADMIN" | "CORRETOR";
    permissoes: string[];
  };
};

export default function UsuarioForm({ modo, usuarioId, valoresIniciais }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(valoresIniciais?.nome || "");
  const [email, setEmail] = useState(valoresIniciais?.email || "");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"ADMIN" | "CORRETOR">(valoresIniciais?.papel || "CORRETOR");
  const [permissoes, setPermissoes] = useState<string[]>(valoresIniciais?.permissoes || ["leads"]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function alternarPermissao(chave: string) {
    setPermissoes((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const url = modo === "criar" ? "/api/usuarios" : `/api/usuarios/${usuarioId}`;
    const method = modo === "criar" ? "POST" : "PUT";
    const body =
      modo === "criar"
        ? { nome, email, senha, papel, permissoes }
        : { nome, papel, permissoes };

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível salvar o usuário.");
      return;
    }

    setSucesso(true);
    // Mostra a confirmação por um instante antes de voltar para a lista.
    setTimeout(() => router.push("/admin/usuarios"), 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5 max-w-lg">
      <ModalSucesso aberto={sucesso} mensagem="Usuário salvo com sucesso!" onClose={() => setSucesso(false)} />
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

      {modo === "criar" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial</label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as "ADMIN" | "CORRETOR")}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        >
          <option value="ADMIN">Administrador (acesso total)</option>
          <option value="CORRETOR">Corretor (acesso restrito)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">O que esse usuário pode acessar</label>
        <div className="grid grid-cols-2 gap-2">
          {MODULOS.map((modulo) => (
            <label key={modulo.chave} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={permissoes.includes(modulo.chave)}
                onChange={() => alternarPermissao(modulo.chave)}
              />
              {modulo.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Mesmo marcando "Usuários", apenas Administradores conseguem de fato gerenciar outros usuários.
        </p>
      </div>

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
