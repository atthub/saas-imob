"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X, MapPin, Phone, MessageCircle } from "lucide-react";

type LPData = {
  titulo: string;
  descricao: string | null;
  cta: string | null;
  imovelId: string;
  imobiliariaId: string;
  turnstileSiteKey: string;
  imovel: {
    id: string;
    codigo: string;
    titulo: string;
    descricao: string | null;
    quartos: number | null;
    banheiros: number | null;
    vagasGaragem: number | null;
    areaTotal: number | null;
    valorVenda: number | null;
    valorLocacao: number | null;
    bairro: { nome: string } | null;
    cidade: { nome: string } | null;
    fotos: { url: string }[];
    imobiliaria: {
      nome: string;
      logoUrl: string | null;
      logoAltura: number | null;
      telefone: string | null;
      whatsapp: string | null;
      email: string | null;
      endereco: string | null;
      cidadePrincipal: string | null;
      creci: string | null;
    };
  };
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Lightbox({ fotos, indiceInicial, onFechar }: { fotos: string[]; indiceInicial: number; onFechar: () => void }) {
  const [indice, setIndice] = useState(indiceInicial);
  const anterior = useCallback(() => setIndice((i) => (i - 1 + fotos.length) % fotos.length), [fotos.length]);
  const proxima = useCallback(() => setIndice((i) => (i + 1) % fotos.length), [fotos.length]);
  const [toqueX, setToqueX] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [anterior, proxima, onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onFechar}
      onTouchStart={(e) => setToqueX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toqueX === null) return;
        const diff = e.changedTouches[0].clientX - toqueX;
        if (Math.abs(diff) > 40) diff > 0 ? anterior() : proxima();
        setToqueX(null);
      }}
    >
      <button type="button" onClick={onFechar} className="absolute top-4 right-4 bg-black/40 text-white rounded-full p-2 hover:bg-black/60">
        <X className="w-6 h-6" />
      </button>
      {fotos.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); anterior(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 md:p-3 hover:bg-black/60">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); proxima(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 md:p-3 hover:bg-black/60">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fotos[indice]} alt="" onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[85vh] object-contain" />
      {fotos.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs rounded-full px-3 py-1">
          {indice + 1} / {fotos.length}
        </span>
      )}
    </div>
  );
}

function LeadFormSimples({ imovelId, imobiliariaId, turnstileSiteKey }: { imovelId: string; imobiliariaId: string; turnstileSiteKey: string }) {
  const LP_SITE_KEY = turnstileSiteKey;
  const formRef = useRef<HTMLFormElement>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const tokenInput = formRef.current?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
    const turnstileToken = tokenInput?.value || (LP_SITE_KEY ? "" : "dev-sem-chave");

    if (LP_SITE_KEY && !turnstileToken) {
      setErro("Confirme o captcha antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, mensagem, imovelId, imobiliariaId, turnstileToken })
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setEnviado(true); }
      else { setErro(d.erro || "Erro ao enviar. Tente novamente."); }
    } catch { setErro("Erro ao enviar. Tente novamente."); }
    setEnviando(false);
  }

  if (enviado) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-gray-800">Mensagem enviada!</p>
        <p className="text-sm text-gray-500 mt-1">Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <>
      {LP_SITE_KEY && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
      <form ref={formRef} onSubmit={enviar} className="space-y-3">
        <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        <input required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp" type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Mensagem (opcional)" rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
        {LP_SITE_KEY && (
          <div className="cf-turnstile" data-sitekey={LP_SITE_KEY} data-theme="light" />
        )}
        {erro && <p className="text-xs text-red-500">{erro}</p>}
        <button type="submit" disabled={enviando} className="w-full bg-gray-900 text-white font-semibold rounded-lg px-4 py-3 text-sm hover:bg-gray-700 transition disabled:opacity-60">
          {enviando ? "Enviando..." : "Enviar mensagem"}
        </button>
      </form>
    </>
  );
}

export default function LandingPagePublica() {
  const { slug } = useParams<{ slug: string }>();
  const [lp, setLp] = useState<LPData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [lightbox, setLightbox] = useState<{ fotos: string[]; indice: number } | null>(null);

  useEffect(() => {
    fetch(`/api/lp/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setLp(d); setCarregando(false); });
  }, [slug]);

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Carregando...</div>;
  if (!lp) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Página não encontrada.</div>;

  const { imovel } = lp;
  const imob = imovel.imobiliaria;
  const titulo = lp.titulo || imovel.titulo;
  const descricao = lp.descricao || imovel.descricao;
  const ctaTexto = lp.cta || "Tenho interesse neste imóvel";
  const urlsFotos = imovel.fotos.map((f) => f.url).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — só logo */}
      <header className="bg-white border-b py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center">
          {imob.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imob.logoUrl} alt={imob.nome} style={{ height: imob.logoAltura || 48 }} className="w-auto object-contain" />
          ) : (
            <span className="font-bold text-xl text-gray-900">{imob.nome}</span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Foto capa com clique */}
        {urlsFotos.length > 0 && (
          <button
            type="button"
            onClick={() => setLightbox({ fotos: urlsFotos, indice: 0 })}
            className="w-full relative group overflow-hidden rounded-2xl shadow-md cursor-zoom-in"
            aria-label="Ampliar foto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlsFotos[0]} alt={titulo} className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
            {urlsFotos.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs rounded-full px-2.5 py-1">
                Ver todas as {urlsFotos.length} fotos
              </span>
            )}
          </button>
        )}

        {/* Título e localização */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{titulo}</h1>
          {(imovel.bairro || imovel.cidade) && (
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {[imovel.bairro?.nome, imovel.cidade?.nome].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Preços */}
        {(imovel.valorVenda || imovel.valorLocacao) && (
          <div className="flex flex-wrap gap-6">
            {imovel.valorVenda && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Venda</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{formatarMoeda(imovel.valorVenda)}</p>
              </div>
            )}
            {imovel.valorLocacao && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Locação</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {formatarMoeda(imovel.valorLocacao)}<span className="text-base font-normal text-gray-400">/mês</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Características */}
        {(imovel.quartos || imovel.banheiros || imovel.vagasGaragem || imovel.areaTotal) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {imovel.quartos && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <p className="text-2xl font-bold text-gray-900">{imovel.quartos}</p>
                <p className="text-xs text-gray-500 mt-1">Quartos</p>
              </div>
            )}
            {imovel.banheiros && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <p className="text-2xl font-bold text-gray-900">{imovel.banheiros}</p>
                <p className="text-xs text-gray-500 mt-1">Banheiros</p>
              </div>
            )}
            {imovel.vagasGaragem && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <p className="text-2xl font-bold text-gray-900">{imovel.vagasGaragem}</p>
                <p className="text-xs text-gray-500 mt-1">Vagas</p>
              </div>
            )}
            {imovel.areaTotal && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <p className="text-2xl font-bold text-gray-900">{imovel.areaTotal}m²</p>
                <p className="text-xs text-gray-500 mt-1">Área total</p>
              </div>
            )}
          </div>
        )}

        {/* Galeria de fotos — todas clicáveis */}
        {urlsFotos.length > 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {urlsFotos.slice(1).map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightbox({ fotos: urlsFotos, indice: i + 1 })}
                  className="relative group overflow-hidden rounded-lg aspect-video cursor-zoom-in"
                  aria-label={`Ampliar foto ${i + 2}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        {descricao && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold text-gray-900 mb-3">Sobre este imóvel</h2>
            <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{descricao}</p>
          </div>
        )}

        {/* Formulário de contato */}
        <div className="bg-white rounded-2xl p-6 shadow-md border" id="contato">
          <h2 className="font-bold text-xl text-gray-900 mb-1">{ctaTexto}</h2>
          <p className="text-sm text-gray-500 mb-5">Preencha o formulário e entraremos em contato em breve.</p>
          <LeadFormSimples imovelId={lp.imovelId} imobiliariaId={lp.imobiliariaId} turnstileSiteKey={lp.turnstileSiteKey} />

          {/* WhatsApp direto */}
          {imob.whatsapp && (
            <a
              href={`https://wa.me/${imob.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${imovel.codigo} - ${imovel.titulo}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 font-semibold rounded-lg px-4 py-3 text-sm hover:bg-green-50 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </main>

      {/* Rodapé com endereço e CRECI */}
      <footer className="bg-gray-900 text-white/70 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <div>
              <p className="text-white font-semibold text-sm mb-2">{imob.nome}</p>
              {imob.endereco && (
                <p className="flex items-start gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {imob.endereco}{imob.cidadePrincipal ? ` · ${imob.cidadePrincipal}` : ""}
                </p>
              )}
              {imob.creci && (
                <p className="text-sm mt-1">CRECI: <span className="text-white">{imob.creci}</span></p>
              )}
            </div>
            <div className="space-y-1.5 text-sm">
              {imob.telefone && (
                <a href={`tel:${imob.telefone}`} className="flex items-center gap-1.5 hover:text-white transition">
                  <Phone className="w-4 h-4" /> {imob.telefone}
                </a>
              )}
              {imob.whatsapp && (
                <a href={`https://wa.me/${imob.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-4 text-xs text-white/40 text-center">
            &copy; {new Date().getFullYear()} {imob.nome}. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox fotos={lightbox.fotos} indiceInicial={lightbox.indice} onFechar={() => setLightbox(null)} />
      )}
    </div>
  );
}
