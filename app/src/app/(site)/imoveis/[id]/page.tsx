import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { obterImobiliariaAtual } from "@/lib/tenant";
import { SELECT_IMOVEL_PUBLICO, SELECT_IMOVEL_PUBLICO_RESUMO, imovelParaResumo } from "@/lib/imoveisPublicos";
import LeadForm from "../../_components/LeadForm";
import { Bed, BedDouble, Bath, Car, Ruler } from "lucide-react";
import { iconeDaCaracteristica } from "@/lib/icones";
import GaleriaFotos from "./_components/GaleriaFotos";
import RegistrarImovelWhatsapp from "../../_components/RegistrarImovelWhatsapp";
import PropertyCard from "../../_components/PropertyCard";
import BotoesCompartilhamento from "./_components/BotoesCompartilhamento";

// Sempre renderizar no servidor a cada requisição: garante que banners,
// imóveis em destaque e novos cadastros apareçam imediatamente, sem cache
// estático gerado no build.
export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  TERRENO: "Terreno",
  SALA_COMERCIAL: "Sala comercial",
  GALPAO: "Galpão",
  CHACARA: "Chácara",
  KITNET: "Kitnet",
  ESPACO_FESTAS: "Espaço para festas",
  OUTRO: "Imóvel"
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return {};

  const imovel = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: imobiliaria.id },
    select: {
      titulo: true,
      descricao: true,
      tipo: true,
      fotos: { where: { capa: true }, take: 1, select: { url: true } }
    }
  });

  if (!imovel) return { title: imobiliaria.nome };

  const host = headers().get("host") || "";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocolo}://${host}`;

  const fotoCapaUrl = imovel.fotos[0]?.url
    ? `${baseUrl}${imovel.fotos[0].url}`
    : imobiliaria.logoUrl || undefined;

  const tipoLabel = TIPO_LABEL[imovel.tipo] || "Imóvel";
  const title = `${imovel.titulo} | ${imobiliaria.nome}`;
  const description =
    imovel.descricao?.slice(0, 155) ||
    `${tipoLabel} disponível. Entre em contato com ${imobiliaria.nome} para mais informações.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(fotoCapaUrl ? { images: [{ url: fotoCapaUrl, width: 1200, height: 630, alt: imovel.titulo }] } : {}),
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(fotoCapaUrl ? { images: [fotoCapaUrl] } : {})
    }
  };
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ImovelDetalhePage({ params }: { params: { id: string } }) {
  const imobiliaria = await obterImobiliariaAtual();
  if (!imobiliaria) return null;

  const imovel = await prisma.imovel.findFirst({
    where: { id: params.id, imobiliariaId: imobiliaria.id, status: { not: "INATIVO" } },
    select: SELECT_IMOVEL_PUBLICO
  });

  if (!imovel) notFound();

  // Atualiza contador de visualizações de forma "fire and forget".
  prisma.imovel.update({ where: { id: imovel.id }, data: { visualizacoes: { increment: 1 } } }).catch(() => {});

  // Imóveis relacionados: mesmo tipo ou mesma cidade, excluindo o atual
  const relacionados = await prisma.imovel.findMany({
    where: {
      imobiliariaId: imobiliaria.id,
      status: "DISPONIVEL",
      id: { not: imovel.id },
      OR: [
        { tipo: imovel.tipo },
        ...(imovel.cidade ? [{ cidadeId: imovel.cidade.id }] : [])
      ]
    },
    orderBy: { criadoEm: "desc" },
    take: 3,
    select: SELECT_IMOVEL_PUBLICO_RESUMO
  });
  const relacionadosResumo = relacionados.map(imovelParaResumo);

  const fotos = imovel.fotos.length > 0 ? imovel.fotos : [{ id: "placeholder", url: "", ordem: 0, capa: true }];
  const valor =
    imovel.finalidade === "LOCACAO" && imovel.valorLocacao
      ? `${formatarMoeda(Number(imovel.valorLocacao))}/mês`
      : imovel.valorVenda
      ? formatarMoeda(Number(imovel.valorVenda))
      : "Consulte";

  const host = headers().get("host") || "";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  const urlCompleta = `${protocolo}://${host}/imoveis/${imovel.id}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <RegistrarImovelWhatsapp codigo={imovel.codigo} titulo={imovel.titulo} />
      <span className="text-xs text-gray-400">
        {TIPO_LABEL[imovel.tipo] || imovel.tipo} · Código {imovel.codigo}
      </span>
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-dark mt-1 mb-1">{imovel.titulo}</h1>
      {(imovel.bairro || imovel.cidade) && (
        <p className="text-sm text-gray-500 mb-1">
          {[imovel.bairro?.nome, imovel.cidade?.nome].filter(Boolean).join(", ")}
        </p>
      )}
      <BotoesCompartilhamento titulo={imovel.titulo} url={urlCompleta} />

      <div className="grid lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <GaleriaFotos fotos={fotos} alt={imovel.titulo} />

          <div className="flex flex-wrap gap-4 bg-white border rounded-xl p-4 text-sm text-brand-dark">
            {!!imovel.quartos && (
              <span className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-brand-goldVivid" /> {imovel.quartos} quartos
              </span>
            )}
            {!!imovel.suites && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-brand-goldVivid" /> {imovel.suites} suítes
              </span>
            )}
            {!!imovel.banheiros && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-brand-goldVivid" /> {imovel.banheiros} banheiros
              </span>
            )}
            {!!imovel.vagasGaragem && (
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-brand-goldVivid" /> {imovel.vagasGaragem} vagas
              </span>
            )}
            {!!imovel.areaTotal && (
              <span className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-brand-goldVivid" /> {Number(imovel.areaTotal)} m² área total
              </span>
            )}
            {!!imovel.areaConstruida && (
              <span className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-brand-goldVivid" /> {Number(imovel.areaConstruida)} m² construídos
              </span>
            )}
          </div>

          {imovel.descricao && (
            <div>
              <h2 className="font-heading font-semibold text-brand-dark mb-2">Descrição</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{imovel.descricao}</p>
            </div>
          )}

          {imovel.caracteristicas.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-brand-dark mb-2">Características</h2>
              <div className="flex flex-wrap gap-2">
                {imovel.caracteristicas.map((c) => {
                  const Icone = iconeDaCaracteristica(c.caracteristica.nome);
                  return (
                    <span
                      key={c.caracteristica.id}
                      className="flex items-center gap-1.5 bg-brand-light text-brand-dark text-xs rounded-full px-3 py-1"
                    >
                      <Icone className="w-3.5 h-3.5" />
                      {c.caracteristica.nome}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {imovel.condominioCaracteristicas.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-brand-dark mb-2">Condomínio</h2>
              <div className="flex flex-wrap gap-2">
                {imovel.condominioCaracteristicas.map((c) => {
                  const Icone = iconeDaCaracteristica(c.caracteristica.nome);
                  return (
                    <span
                      key={c.caracteristica.id}
                      className="flex items-center gap-1.5 bg-brand-light text-brand-dark text-xs rounded-full px-3 py-1"
                    >
                      <Icone className="w-3.5 h-3.5" />
                      {c.caracteristica.nome}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-5 space-y-3">
            {/* Venda */}
            {imovel.valorVenda && imovel.finalidade !== "LOCACAO" && (
              <div>
                <span className="text-xs text-gray-400">
                  {imovel.finalidade === "VENDA_E_LOCACAO" ? "Venda" : "Valor"}
                </span>
                <div className="font-heading text-2xl font-bold text-brand-goldVivid">
                  {formatarMoeda(Number(imovel.valorVenda))}
                </div>
              </div>
            )}
            {/* Locação */}
            {imovel.valorLocacao && imovel.finalidade !== "VENDA" && (
              <div>
                <span className="text-xs text-gray-400">
                  {imovel.finalidade === "VENDA_E_LOCACAO" ? "Locação" : "Aluguel"}
                </span>
                <div className={`font-heading font-bold text-brand-goldVivid ${imovel.finalidade === "VENDA_E_LOCACAO" ? "text-xl" : "text-2xl"}`}>
                  {formatarMoeda(Number(imovel.valorLocacao))}<span className="text-sm font-normal text-gray-400">/mês</span>
                </div>
              </div>
            )}
            {/* Sem valor */}
            {!imovel.valorVenda && !imovel.valorLocacao && (
              <div className="font-heading text-2xl font-bold text-brand-goldVivid">Consulte</div>
            )}
            {imovel.valorCondominio != null && (
              <p className="text-xs text-gray-500 border-t pt-2">
                Condomínio: {formatarMoeda(Number(imovel.valorCondominio))}
              </p>
            )}
            {imovel.valorIptu != null && (
              <p className="text-xs text-gray-500">IPTU: {formatarMoeda(Number(imovel.valorIptu))}</p>
            )}
          </div>

          <LeadForm
            imovelId={imovel.id}
            imobiliariaId={imobiliaria.id}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
          />
        </div>
      </div>

      {/* Imóveis relacionados */}
      {relacionadosResumo.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-xl font-bold text-brand-dark mb-6">Imóveis relacionados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionadosResumo.map((rel) => (
              <PropertyCard key={rel.id} imovel={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
