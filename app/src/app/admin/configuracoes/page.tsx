import type { FC } from "react";
import IdentidadeVisualForm from "./_components/IdentidadeVisualForm";
import TemplatesECoresForm from "./_components/TemplatesECoresForm";
import ContatoForm from "./_components/ContatoForm";
import RedesSociaisForm from "./_components/RedesSociaisForm";
import MarcaDaguaForm from "./_components/MarcaDaguaForm";
import WhatsappFlutuanteForm from "./_components/WhatsappFlutuanteForm";
import PaginacaoForm from "./_components/PaginacaoForm";
import PortaisXmlForm from "./_components/PortaisXmlForm";
import MensagensWhatsappForm from "./_components/MensagensWhatsappForm";
import BannersConfigForm from "./_components/BannersConfigForm";
import ImportarDadosForm from "./_components/ImportarDadosForm";

const SECOES: Record<string, { label: string; Component: FC }> = {
  identidade:          { label: "Identidade visual",     Component: IdentidadeVisualForm },
  templates:           { label: "Templates e cores",      Component: TemplatesECoresForm },
  contato:             { label: "Contato e localização",  Component: ContatoForm },
  redes:               { label: "Redes Sociais",          Component: RedesSociaisForm },
  "marca-dagua":       { label: "Marca D'água",           Component: MarcaDaguaForm },
  whatsapp:            { label: "WhatsApp flutuante",     Component: WhatsappFlutuanteForm },
  paginacao:           { label: "Paginação e destaque",   Component: PaginacaoForm },
  portais:             { label: "Portais (XML)",          Component: PortaisXmlForm },
  "whatsapp-templates":{ label: "Templates WhatsApp",     Component: MensagensWhatsappForm },
  banners:             { label: "Banners",                Component: BannersConfigForm },
  importar:            { label: "Importar dados",         Component: ImportarDadosForm },
};

export default function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { secao?: string };
}) {
  const secaoKey = searchParams.secao || "identidade";
  const secao = SECOES[secaoKey] ?? SECOES.identidade;
  const { label, Component } = secao;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Configurações</p>
        <h1 className="text-2xl font-bold text-brand-dark">{label}</h1>
      </div>
      <Component />
    </div>
  );
}
