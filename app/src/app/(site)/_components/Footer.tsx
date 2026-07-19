import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { iconeDaRedeSocial } from "@/lib/icones";

type Props = {
  imobiliaria: {
    nome: string;
    telefone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    endereco?: string | null;
    cidadePrincipal?: string | null;
    redesSociais?: { id: string; plataforma: string; url: string }[];
  } | null;
};

export default function Footer({ imobiliaria }: Props) {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white/80 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-white font-heading text-lg font-bold mb-3">
            {imobiliaria?.nome || "Vitrine Imobiliária"}
          </h3>
          {imobiliaria?.endereco && (
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              {imobiliaria.endereco}
            </p>
          )}
          {imobiliaria?.cidadePrincipal && <p className="text-sm pl-6">{imobiliaria.cidadePrincipal}</p>}
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Contato</h4>
          <ul className="space-y-2 text-sm">
            {imobiliaria?.telefone && (
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {imobiliaria.telefone}
              </li>
            )}
            {imobiliaria?.whatsapp && (
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp: {imobiliaria.whatsapp}
              </li>
            )}
            {imobiliaria?.email && (
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {imobiliaria.email}
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Redes sociais</h4>
          <ul className="space-y-2 text-sm">
            {(imobiliaria?.redesSociais || []).map((r) => {
              const Icone = iconeDaRedeSocial(r.plataforma);
              return (
                <li key={r.id}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-brand-gold transition"
                  >
                    <Icone className="w-4 h-4" />
                    {r.plataforma}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>
            &copy; {ano} {imobiliaria?.nome || "Vitrine Imobiliária"}. Todos os direitos reservados.
          </span>
          <a
            href="https://attitudehub.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <span>Desenvolvido por</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://attitudehub.com.br/wp-content/uploads/2026/05/logo_horizontal_hub.png"
              alt="Attitude Hub"
              className="h-5 object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
