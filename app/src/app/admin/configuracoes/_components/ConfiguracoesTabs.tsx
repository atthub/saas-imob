"use client";

import { useState } from "react";
import IdentidadeVisualForm from "./IdentidadeVisualForm";
import TemplatesECoresForm from "./TemplatesECoresForm";
import ContatoForm from "./ContatoForm";
import RedesSociaisForm from "./RedesSociaisForm";
import MarcaDaguaForm from "./MarcaDaguaForm";
import WhatsappFlutuanteForm from "./WhatsappFlutuanteForm";
import PaginacaoForm from "./PaginacaoForm";
import ImportarDadosForm from "./ImportarDadosForm";
import PortaisXmlForm from "./PortaisXmlForm";
import BannersConfigForm from "./BannersConfigForm";
import MensagensWhatsappForm from "./MensagensWhatsappForm";

const ABAS = [
  { id: "identidade", label: "Identidade visual" },
  { id: "templates", label: "Templates e cores" },
  { id: "contato", label: "Contato e localização" },
  { id: "redes", label: "Redes Sociais" },
  { id: "marca-dagua", label: "Marca D'água" },
  { id: "whatsapp", label: "Balão flutuante de Whatsapp" },
  { id: "paginacao", label: "Paginação" },
  { id: "importar", label: "Importar dados" },
  { id: "portais", label: "Portais (XML)" },
  { id: "banners", label: "Banners" },
  { id: "whatsapp-templates", label: "Templates WhatsApp" },
];

export default function ConfiguracoesTabs() {
  const [abaAtiva, setAbaAtiva] = useState("identidade");

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                abaAtiva === aba.id
                  ? "border-brand-gold text-brand-dark"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {abaAtiva === "identidade" && <IdentidadeVisualForm />}
        {abaAtiva === "templates" && <TemplatesECoresForm />}
        {abaAtiva === "contato" && <ContatoForm />}
        {abaAtiva === "redes" && <RedesSociaisForm />}
        {abaAtiva === "marca-dagua" && <MarcaDaguaForm />}
        {abaAtiva === "whatsapp" && <WhatsappFlutuanteForm />}
        {abaAtiva === "paginacao" && <PaginacaoForm />}
        {abaAtiva === "importar" && <ImportarDadosForm />}
        {abaAtiva === "portais" && <PortaisXmlForm />}
        {abaAtiva === "banners" && <BannersConfigForm />}
        {abaAtiva === "whatsapp-templates" && <MensagensWhatsappForm />}
      </div>
    </div>
  );
}
