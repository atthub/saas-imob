"use client";

import Link from "next/link";
import { UploadCloud, FileText } from "lucide-react";

export default function ImportarDadosForm() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold text-brand-dark">Importar dados</h2>
        <p className="text-sm text-gray-500">Importe imóveis a partir de fontes externas ou arquivos.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/importacao-wordpress"
          className="flex flex-col gap-3 border rounded-xl p-5 hover:border-brand-gold hover:bg-brand-gold/5 transition group"
        >
          <div className="w-10 h-10 bg-brand-dark/10 rounded-lg flex items-center justify-center group-hover:bg-brand-gold/20 transition">
            <UploadCloud size={20} className="text-brand-dark" />
          </div>
          <div>
            <p className="font-semibold text-sm text-brand-dark">Importar do WordPress</p>
            <p className="text-xs text-gray-500 mt-1">
              Importe imóveis cadastrados no WordPress (plugin Classified Listing) via URL da API JSON.
            </p>
          </div>
          <span className="text-xs font-medium text-brand-gold mt-auto">Acessar →</span>
        </Link>

        <div className="flex flex-col gap-3 border rounded-xl p-5 border-dashed opacity-60 cursor-not-allowed">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-600">Importar via XML</p>
            <p className="text-xs text-gray-400 mt-1">
              Importe imóveis a partir de um arquivo XML (formato padrão dos portais imobiliários). Em breve.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400 mt-auto">Em breve</span>
        </div>
      </div>
    </div>
  );
}
