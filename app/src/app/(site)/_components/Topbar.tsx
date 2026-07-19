import { Phone, MessageCircle } from "lucide-react";
import { iconeDaRedeSocial } from "@/lib/icones";
import PwaInstallButton from "@/app/_components/PwaInstallButton";

type Props = {
  imobiliaria: {
    telefone?: string | null;
    whatsapp?: string | null;
    creci?: string | null;
    redesSociais?: { id: string; plataforma: string; url: string }[];
  } | null;
};

export default function Topbar({ imobiliaria }: Props) {
  const redes = imobiliaria?.redesSociais || [];

  return (
    <div className="bg-brand-dark text-white text-xs">
      <div className="max-w-6xl mx-auto px-4 h-9 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {imobiliaria?.creci && (
            <span className="text-gray-400">
              CRECI: <span className="text-white">{imobiliaria.creci}</span>
            </span>
          )}
          {imobiliaria?.telefone && (
            <a
              href={`tel:${imobiliaria.telefone}`}
              className="flex items-center gap-1.5 hover:text-brand-gold transition"
            >
              <Phone className="w-3.5 h-3.5" />
              {imobiliaria.telefone}
            </a>
          )}
          {imobiliaria?.whatsapp && (
            <a
              href={`https://wa.me/${imobiliaria.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-brand-gold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {redes.map((r) => {
            const Icone = iconeDaRedeSocial(r.plataforma);
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-gold transition"
                aria-label={r.plataforma}
              >
                <Icone className="w-3.5 h-3.5" />
              </a>
            );
          })}
          <PwaInstallButton variant="topbar" />
        </div>
      </div>
    </div>
  );
}
