"use client";

import { useEffect, useState } from "react";
import ModalSucesso from "../_components/ModalSucesso";

type Funcionalidades = {
  landingPagesHabilitado: boolean;
  comissoesHabilitado: boolean;
};

type ConfigSmtp = {
  smtpHost: string;
  smtpPorta: number | null;
  smtpUsuario: string;
  smtpSenhaPreenchida: boolean;
  smtpRemetente: string;
  smtpSeguro: boolean;
};

// Página exclusiva do SUPER_ADMIN (dono do SaaS) — configuração de SMTP usada
// para enviar o e-mail de "esqueci minha senha" a qualquer usuário de
// qualquer imobiliária na plataforma. Fica em branco até ser preenchida; o
// envio de e-mail simplesmente não funciona enquanto isso (ver lib/email.ts).
export default function PlataformaPage() {
  const [dados, setDados] = useState<ConfigSmtp | null>(null);
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [funcionalidades, setFuncionalidades] = useState<Funcionalidades | null>(null);
  const [salvandoFuncionalidades, setSalvandoFuncionalidades] = useState(false);
  const [seedandoTemplates, setSeedandoTemplates] = useState(false);
  const [seedResultado, setSeedResultado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plataforma/smtp")
      .then((r) => r.json())
      .then((data) => setDados(data.config));
    fetch("/api/plataforma/funcionalidades")
      .then((r) => r.json())
      .then((data) => setFuncionalidades(data.funcionalidades));
  }, []);

  async function alternarFuncionalidade(campo: keyof Funcionalidades) {
    if (!funcionalidades) return;
    const novo = { ...funcionalidades, [campo]: !funcionalidades[campo] };
    setFuncionalidades(novo);
    setSalvandoFuncionalidades(true);
    const resposta = await fetch("/api/plataforma/funcionalidades", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo)
    });
    const data = await resposta.json().catch(() => ({}));
    setSalvandoFuncionalidades(false);
    if (resposta.ok) setFuncionalidades(data.funcionalidades);
  }

  async function salvar() {
    if (!dados) return;
    setSalvando(true);
    setErro(null);

    const resposta = await fetch("/api/plataforma/smtp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, smtpSenha: senha })
    });
    const data = await resposta.json().catch(() => ({}));
    setSalvando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível salvar.");
      return;
    }
    setDados(data.config);
    setSenha("");
    setSucesso(true);
  }

  if (!dados) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  const configurado = Boolean(dados.smtpHost && dados.smtpPorta && dados.smtpUsuario && dados.smtpSenhaPreenchida);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Configurações da plataforma</h1>
        <p className="text-sm text-gray-500">
          Visível só para o administrador do sistema (SUPER_ADMIN). Usado para enviar o e-mail de
          redefinição de senha a qualquer usuário, em qualquer imobiliária.
        </p>
      </div>

      <div
        className={`rounded-md px-3 py-2 text-sm ${
          configurado ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {configurado
          ? "SMTP configurado. O envio de e-mail de redefinição de senha está ativo."
          : "SMTP ainda não configurado. Até preencher os campos abaixo, \"Esqueci minha senha\" não vai enviar e-mail."}
      </div>

      <ModalSucesso aberto={sucesso} mensagem="Configuração de SMTP salva com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-sm text-red-600 rounded-md px-3 py-2">{erro}</div>}

      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host SMTP</label>
            <input
              type="text"
              placeholder="mail.seudominio.com.br"
              value={dados.smtpHost}
              onChange={(e) => setDados({ ...dados, smtpHost: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
            <input
              type="number"
              placeholder="465"
              value={dados.smtpPorta ?? ""}
              onChange={(e) => setDados({ ...dados, smtpPorta: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (e-mail completo)</label>
          <input
            type="text"
            placeholder="naoresponda@seudominio.com.br"
            value={dados.smtpUsuario}
            onChange={(e) => setDados({ ...dados, smtpUsuario: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha {dados.smtpSenhaPreenchida && <span className="text-gray-400">(já configurada — deixe em branco para manter)</span>}
          </label>
          <input
            type="password"
            placeholder={dados.smtpSenhaPreenchida ? "••••••••" : ""}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remetente exibido (opcional)</label>
          <input
            type="text"
            placeholder="Deixe em branco para usar o próprio e-mail de usuário acima"
            value={dados.smtpRemetente}
            onChange={(e) => setDados({ ...dados, smtpRemetente: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segurança da conexão</label>
          <select
            value={dados.smtpSeguro ? "ssl" : "tls"}
            onChange={(e) => setDados({ ...dados, smtpSeguro: e.target.value === "ssl" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="ssl">SSL (geralmente porta 465)</option>
            <option value="tls">STARTTLS (geralmente porta 587)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="bg-brand-goldVivid text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
        >
          {salvando ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>

      <div className="pt-2 border-t">
        <h2 className="text-lg font-bold text-brand-dark">Funcionalidades exclusivas</h2>
        <p className="text-sm text-gray-500">
          Recursos premium que não fazem parte do plano padrão — habilite só para esta imobiliária.
        </p>
      </div>

      {/* Seed de templates */}
      <div className="pt-2 border-t">
        <h2 className="text-lg font-bold text-brand-dark">Templates da vitrine</h2>
        <p className="text-sm text-gray-500 mb-3">
          Popula o banco de dados com os 5 templates disponíveis. Operação idempotente — pode ser executada mais de uma vez sem duplicar registros.
        </p>
        {seedResultado && (
          <p className="text-sm text-green-700 bg-green-50 rounded px-3 py-2 mb-3">{seedResultado}</p>
        )}
        <button
          type="button"
          onClick={async () => {
            setSeedandoTemplates(true);
            setSeedResultado(null);
            const r = await fetch("/api/plataforma/templates/seed", { method: "POST" });
            const d = await r.json().catch(() => ({}));
            setSeedandoTemplates(false);
            if (r.ok) {
              const criados = d.resultados?.filter((x: { status: string }) => x.status === "criado").length ?? 0;
              setSeedResultado(criados > 0 ? `${criados} template(s) criado(s) com sucesso!` : "Todos os templates já existem no banco.");
            } else {
              setSeedResultado("Erro ao criar templates.");
            }
          }}
          disabled={seedandoTemplates}
          className="bg-brand-dark text-white font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-60 text-sm"
        >
          {seedandoTemplates ? "Criando..." : "Criar templates no banco"}
        </button>
      </div>

      {!funcionalidades ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brand-dark">Gerador de Landing Pages</p>
              <p className="text-xs text-gray-500">
                Permite criar páginas de vendas exclusivas por imóvel, para tráfego pago.
              </p>
            </div>
            <input
              type="checkbox"
              checked={funcionalidades.landingPagesHabilitado}
              disabled={salvandoFuncionalidades}
              onChange={() => alternarFuncionalidade("landingPagesHabilitado")}
              className="mt-1 w-5 h-5 accent-brand-goldVivid shrink-0"
            />
          </label>

          <div className="border-t" />

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brand-dark">Módulo de Comissões</p>
              <p className="text-xs text-gray-500">
                Registro de vendas/locações e cálculo automático da sua comissão sobre a comissão da imobiliária.
              </p>
            </div>
            <input
              type="checkbox"
              checked={funcionalidades.comissoesHabilitado}
              disabled={salvandoFuncionalidades}
              onChange={() => alternarFuncionalidade("comissoesHabilitado")}
              className="mt-1 w-5 h-5 accent-brand-goldVivid shrink-0"
            />
          </label>

        </div>
      )}
    </div>
  );
}
