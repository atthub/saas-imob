"use client";

import { useState } from "react";
import { Share2, MessageCircle, Link2, Check } from "lucide-react";

type Props = { titulo: string; url: string };

export default function BotoesCompartilhamento({ titulo, url }: Props) {
  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const textoWhatsapp = encodeURIComponent(`Olha este imóvel que encontrei: ${titulo}\n${url}`);
  const urlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" /> Compartilhar:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${textoWhatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs bg-[#25D366] text-white rounded-full px-3 py-1 hover:opacity-90 transition"
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
      </a>

      {/* Facebook */}
      <a
        href={urlFacebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs bg-[#1877F2] text-white rounded-full px-3 py-1 hover:opacity-90 transition"
        aria-label="Compartilhar no Facebook"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
        Facebook
      </a>

      {/* Copiar link */}
      <button
        onClick={copiarLink}
        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1 hover:bg-gray-200 transition"
        aria-label="Copiar link"
      >
        {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Link2 className="w-3.5 h-3.5" />}
        {copiado ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
