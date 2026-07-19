import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, FileText, Share2 } from "lucide-react";
import ImovelForm from "../../_components/ImovelForm";
import CriarLandingPageButton from "../../_components/CriarLandingPageButton";
import QrCodeButton from "../../_components/QrCodeButton";

export default async function EditarImovelPage({ params }: { params: { id: string } }) {
  const imovel = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: {
      caracteristicas: true,
      condominioCaracteristicas: true,
      landingPage: { select: { id: true, slug: true, status: true } }
    }
  });

  if (!imovel) return notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-dark">Editar imóvel</h1>
        <div className="flex items-center gap-2">
          {imovel.landingPage ? (
            <Link
              href={`/admin/landing-pages/${imovel.landingPage.id}`}
              className="flex items-center gap-2 text-sm border border-brand-gold text-brand-gold rounded-md px-3 py-1.5 hover:bg-brand-gold/5 transition"
            >
              <FileText size={15} />
              {imovel.landingPage.status === "publicada" ? "Editar Landing Page" : "Landing Page (rascunho)"}
            </Link>
          ) : (
            <CriarLandingPageButton imovelId={imovel.id} />
          )}
          <QrCodeButton imovelId={imovel.id} codigo={imovel.codigo} titulo={imovel.titulo} />
          <Link
            href={`/imoveis/${imovel.id}`}
            target="_blank"
            className="flex items-center gap-2 text-sm border border-gray-300 text-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-50 transition"
          >
            <Share2 size={15} />
            Compartilhar
          </Link>
        </div>
      </div>

      {imovel.captacaoOrigemId && (
        <Link
          href="/admin/captacoes"
          className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-3 py-2 w-fit hover:bg-amber-100"
        >
          <ClipboardList className="w-4 h-4" />
          Este imóvel veio de uma captação online — clique para ver a captação original
        </Link>
      )}

      <ImovelForm
        inicial={{
          id: imovel.id,
          codigo: imovel.codigo,
          codigoAutomatico: imovel.codigoAutomatico,
          titulo: imovel.titulo,
          descricao: imovel.descricao || "",
          tipo: imovel.tipo,
          finalidade: imovel.finalidade,
          status: imovel.status,
          valorVenda: imovel.valorVenda?.toString() || "",
          valorLocacao: imovel.valorLocacao?.toString() || "",
          valorCondominio: imovel.valorCondominio?.toString() || "",
          valorIptu: imovel.valorIptu?.toString() || "",
          areaTotal: imovel.areaTotal?.toString() || "",
          areaConstruida: imovel.areaConstruida?.toString() || "",
          quartos: imovel.quartos?.toString() || "",
          suites: imovel.suites?.toString() || "",
          banheiros: imovel.banheiros?.toString() || "",
          vagasGaragem: imovel.vagasGaragem?.toString() || "",
          cidadeId: imovel.cidadeId || "",
          bairroId: imovel.bairroId || "",
          endereco: imovel.endereco || "",
          numero: imovel.numero || "",
          complemento: imovel.complemento || "",
          cep: imovel.cep || "",
          latitude: imovel.latitude,
          longitude: imovel.longitude,
          exibirMapa: imovel.exibirMapa,
          destaque: imovel.destaque,
          proprietarioNome: imovel.proprietarioNome || "",
          proprietarioTelefone: imovel.proprietarioTelefone || "",
          proprietarioEmail: imovel.proprietarioEmail || "",
          proprietarioObs: imovel.proprietarioObs || "",
          locatarioNome: imovel.locatarioNome || "",
          locatarioTelefone: imovel.locatarioTelefone || "",
          locatarioEmail: imovel.locatarioEmail || "",
          locatarioObs: imovel.locatarioObs || "",
          contratoInicio: imovel.contratoInicio ? imovel.contratoInicio.toISOString().slice(0, 10) : "",
          contratoFim: imovel.contratoFim ? imovel.contratoFim.toISOString().slice(0, 10) : "",
          caracteristicaIds: imovel.caracteristicas.map((c) => c.caracteristicaId),
          condominioCaracteristicaIds: imovel.condominioCaracteristicas.map((c) => c.caracteristicaId)
        }}
      />
    </div>
  );
}
