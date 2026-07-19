"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { X } from "lucide-react";

const LIMITE_FOTOS = 10;
const LIMITE_DESCRICAO = 2000;

type Props = { turnstileSiteKey: string };

export default function CaptacaoForm({ turnstileSiteKey }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [nomeProprietario, setNomeProprietario] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [valorPretendido, setValorPretendido] = useState("");
  const [descricao, setDescricao] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function adicionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || []);
    e.target.value = "";
    if (!arquivos.length) return;

    if (fotos.length + arquivos.length > LIMITE_FOTOS) {
      setErro(`Você pode enviar no máximo ${LIMITE_FOTOS} fotos.`);
      return;
    }

    setErro(null);
    setEnviandoFoto(true);

    const novasUrls: string[] = [];
    for (const arquivo of arquivos) {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const resposta = await fetch("/api/upload/captacao-foto", { method: "POST", body: formData });
      const data = await resposta.json().catch(() => ({}));
      if (resposta.ok && data.url) {
        novasUrls.push(data.url);
      }
    }

    setFotos((atuais) => [...atuais, ...novasUrls]);
    setEnviandoFoto(false);
  }

  function removerFoto(url: string) {
    setFotos((atuais) => atuais.filter((f) => f !== url));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    // O widget do Turnstile injeta automaticamente um campo oculto
    // "cf-turnstile-response" dentro do formulário quando o usuário resolve
    // o desafio. Se ainda não há site key configurada (chaves não criadas),
    // seguimos com um valor de desenvolvimento — a verificação real no
    // servidor é pulada nesse caso (ver src/lib/turnstile.ts).
    const tokenInput = formRef.current?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
    const turnstileToken = tokenInput?.value || (turnstileSiteKey ? "" : "dev-sem-chave-configurada");

    if (turnstileSiteKey && !turnstileToken) {
      setErro("Confirme o captcha antes de enviar.");
      return;
    }

    setEnviando(true);

    const resposta = await fetch("/api/captacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeProprietario,
        telefone,
        email: email || null,
        tipoImovel: tipoImovel || null,
        finalidade: finalidade || null,
        endereco: endereco || null,
        cidade: cidade || null,
        bairro: bairro || null,
        valorPretendido: valorPretendido || null,
        descricao: descricao || null,
        fotos,
        turnstileToken
      })
    });
    const data = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(data.erro || "Não foi possível enviar. Tente novamente.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-6 text-sm text-center">
        Recebemos as informações do seu imóvel! Nossa equipe vai avaliar e entrar em contato em breve.
      </div>
    );
  }

  return (
    <>
      {turnstileSiteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      )}

      <form ref={formRef} onSubmit={enviar} className="bg-white border rounded-xl p-5 space-y-4">
        {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            value={nomeProprietario}
            onChange={(e) => setNomeProprietario(e.target.value)}
            placeholder="Seu nome"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <input
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone / WhatsApp"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (opcional)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={tipoImovel}
            onChange={(e) => setTipoImovel(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="">Tipo do imóvel</option>
            <option value="Casa">Casa</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Terreno">Terreno</option>
            <option value="Sala comercial">Sala comercial</option>
            <option value="Galpão">Galpão</option>
            <option value="Chácara">Chácara</option>
            <option value="Kitnet">Kitnet</option>
            <option value="Outro">Outro</option>
          </select>
          <select
            value={finalidade}
            onChange={(e) => setFinalidade(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="">Quero...</option>
            <option value="venda">Vender</option>
            <option value="locacao">Alugar</option>
            <option value="ambos">Vender ou alugar</option>
          </select>
        </div>

        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Endereço (rua e número)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />

        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <input
            value={valorPretendido}
            onChange={(e) => setValorPretendido(e.target.value)}
            placeholder="Valor pretendido"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <div>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, LIMITE_DESCRICAO))}
            maxLength={LIMITE_DESCRICAO}
            rows={4}
            placeholder="Conte um pouco sobre o imóvel (cômodos, diferenciais, estado de conservação...)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{descricao.length}/{LIMITE_DESCRICAO}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fotos do imóvel (até {LIMITE_FOTOS})
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={adicionarFotos}
            disabled={enviandoFoto || fotos.length >= LIMITE_FOTOS}
            className="text-sm"
          />
          {enviandoFoto && <p className="text-xs text-gray-500 mt-1">Enviando fotos...</p>}

          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {fotos.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-md border overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Foto do imóvel" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerFoto(url)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                    aria-label="Remover foto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {turnstileSiteKey && (
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
        )}

        <button
          type="submit"
          disabled={enviando || enviandoFoto}
          className="w-full bg-brand-goldVivid text-white font-semibold rounded-md px-5 py-2 text-sm hover:opacity-90 transition disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar imóvel para avaliação"}
        </button>
      </form>
    </>
  );
}
