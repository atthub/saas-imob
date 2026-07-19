"use client";

export default function DashboardCompartilhar({
  codigo,
  titulo
}: {
  codigo: string;
  titulo: string;
}) {
  function compartilhar() {
    const url = `${window.location.origin}/imoveis/${codigo}`;
    if (navigator.share) {
      navigator.share({ title: titulo, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert("Link copiado!")).catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="flex-1 text-center text-[10px] font-semibold border border-brand-goldVivid text-brand-goldVivid rounded py-1 hover:bg-brand-goldVivid hover:text-white transition"
      title="Compartilhar imóvel"
    >
      Compartilhar
    </button>
  );
}
