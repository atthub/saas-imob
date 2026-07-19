"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Banner = {
  id: string;
  titulo: string | null;
  urlDesktop: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
};

export default function ListaBanners({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [atualizando, setAtualizando] = useState<string | null>(null);

  async function atualizar(id: string, dados: Partial<Banner>) {
    setAtualizando(id);
    await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    setAtualizando(null);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Remover este banner do slider?")) return;
    setAtualizando(id);
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setAtualizando(null);
    router.refresh();
  }

  if (banners.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum banner cadastrado ainda.</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-left">
          <tr>
            <th className="px-4 py-3">Imagem</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Ordem</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id} className="border-t">
              <td className="px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.urlDesktop} alt={banner.titulo || "Banner"} className="h-12 w-24 object-cover rounded-md" />
              </td>
              <td className="px-4 py-3 text-gray-500">{banner.titulo || "-"}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  defaultValue={banner.ordem}
                  disabled={atualizando === banner.id}
                  onBlur={(e) => atualizar(banner.id, { ordem: Number(e.target.value) })}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => atualizar(banner.id, { ativo: !banner.ativo })}
                  disabled={atualizando === banner.id}
                  className={banner.ativo ? "text-green-600 text-xs font-medium" : "text-gray-400 text-xs font-medium"}
                >
                  {banner.ativo ? "Ativo" : "Inativo"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => excluir(banner.id)}
                  disabled={atualizando === banner.id}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
