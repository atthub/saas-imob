"use client";

import { useState } from "react";
import { QrCode, X, Download } from "lucide-react";

export default function QrCodeButton({ imovelId, codigo, titulo }: { imovelId: string; codigo: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/imoveis/${imovelId}`
    : `/imoveis/${imovelId}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(url)}`;

  async function baixar() {
    const urlAtual = `${window.location.origin}/imoveis/${imovelId}`;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&data=${encodeURIComponent(urlAtual)}`;
    try {
      const res = await fetch(apiUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `qrcode-imovel-${codigo}.png`;
      a.click();
    } catch {
      window.open(apiUrl, "_blank");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
        title="Gerar QR Code"
      >
        <QrCode size={15} />
        QR Code
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <QrCode size={20} className="text-brand-goldVivid" />
                QR Code do imóvel
              </h2>
              <button type="button" onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 line-clamp-1">{titulo}</p>
            <p className="text-xs text-gray-400 font-mono break-all">{url}</p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR Code do imóvel"
              className="mx-auto rounded-lg border w-52 h-52"
            />

            <button
              type="button"
              onClick={baixar}
              className="w-full flex items-center justify-center gap-2 py-2 bg-brand-goldVivid text-white font-semibold text-sm rounded-lg hover:opacity-90"
            >
              <Download size={16} />
              Baixar QR Code
            </button>
          </div>
        </div>
      )}
    </>
  );
}
