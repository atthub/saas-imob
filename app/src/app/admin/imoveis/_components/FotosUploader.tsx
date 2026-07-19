"use client";

import { useEffect, useRef, useState } from "react";

type Foto = { id: string; url: string; capa: boolean };

type Pendente = {
  chave: string;
  previewUrl: string;
  status: "enviando" | "erro";
  erro?: string;
};

export default function FotosUploader({ imovelId }: { imovelId: string }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [marcaDagua, setMarcaDagua] = useState(true);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function carregar() {
    const resposta = await fetch(`/api/imoveis/${imovelId}`);
    const data = await resposta.json();
    setFotos(data.imovel?.fotos || []);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imovelId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;

    const lista = Array.from(arquivos);
    const novosPendentes: Pendente[] = lista.map((arquivo) => ({
      chave: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      previewUrl: URL.createObjectURL(arquivo),
      status: "enviando"
    }));
    setPendentes((atuais) => [...atuais, ...novosPendentes]);
    e.target.value = "";

    for (let i = 0; i < lista.length; i += 1) {
      const arquivo = lista[i];
      const pendente = novosPendentes[i];
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("imovelId", imovelId);
      formData.append("marcaDagua", String(marcaDagua));

      try {
        // eslint-disable-next-line no-await-in-loop
        const resposta = await fetch("/api/upload/foto", { method: "POST", body: formData });
        // eslint-disable-next-line no-await-in-loop
        const data = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
          setPendentes((atuais) =>
            atuais.map((p) =>
              p.chave === pendente.chave
                ? { ...p, status: "erro", erro: data.erro || "Falha ao enviar." }
                : p
            )
          );
          continue;
        }

        // Sucesso: remove esse pendente (a foto real já vem da lista atualizada abaixo)
        URL.revokeObjectURL(pendente.previewUrl);
        setPendentes((atuais) => atuais.filter((p) => p.chave !== pendente.chave));
        if (data.avisoMarcaDagua) {
          setAvisos((atuais) => [...atuais, `${arquivo.name}: ${data.avisoMarcaDagua}`]);
        }
        // eslint-disable-next-line no-await-in-loop
        await carregar();
      } catch {
        setPendentes((atuais) =>
          atuais.map((p) =>
            p.chave === pendente.chave
              ? { ...p, status: "erro", erro: "Falha de conexão ao enviar." }
              : p
          )
        );
      }
    }
  }

  function removerPendente(chave: string) {
    setPendentes((atuais) => {
      const alvo = atuais.find((p) => p.chave === chave);
      if (alvo) URL.revokeObjectURL(alvo.previewUrl);
      return atuais.filter((p) => p.chave !== chave);
    });
  }

  async function excluirFoto(fotoId: string) {
    if (!confirm("Excluir esta foto?")) return;
    setErroExclusao(null);
    try {
      const resposta = await fetch(`/api/fotos/${fotoId}`, { method: "DELETE" });
      const data = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErroExclusao(data.erro || `Não foi possível excluir (HTTP ${resposta.status}).`);
        return;
      }
    } catch {
      setErroExclusao("Falha de conexão ao excluir a foto.");
      return;
    }
    await carregar();
  }

  async function salvarNovaOrdem(novaLista: Foto[]) {
    setFotos(novaLista);
    setSalvandoOrdem(true);
    await fetch(`/api/imoveis/${imovelId}/fotos/reordenar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem: novaLista.map((f) => f.id) })
    });
    setSalvandoOrdem(false);
    await carregar();
  }

  function onDropFoto(idDestino: string) {
    if (!arrastandoId || arrastandoId === idDestino) return;
    const lista = [...fotos];
    const origemIdx = lista.findIndex((f) => f.id === arrastandoId);
    const destinoIdx = lista.findIndex((f) => f.id === idDestino);
    if (origemIdx === -1 || destinoIdx === -1) return;
    const [movida] = lista.splice(origemIdx, 1);
    lista.splice(destinoIdx, 0, movida);
    setArrastandoId(null);
    salvarNovaOrdem(lista);
  }

  const enviandoAlgo = pendentes.some((p) => p.status === "enviando");

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={marcaDagua}
          onChange={(e) => setMarcaDagua(e.target.checked)}
        />
        Aplicar marca d'água automaticamente nas fotos enviadas
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="text-sm"
      />
      {enviandoAlgo && <p className="text-sm text-gray-500">Enviando fotos...</p>}
      {salvandoOrdem && <p className="text-sm text-gray-500">Salvando nova ordem...</p>}

      <p className="text-xs text-gray-400">
        Arraste uma foto sobre outra para reordenar. A primeira foto da lista é usada como capa do imóvel.
      </p>
      {erroExclusao && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{erroExclusao}</p>
      )}
      {avisos.length > 0 && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 space-y-1">
          {avisos.map((aviso, idx) => (
            <p key={idx}>⚠ {aviso}</p>
          ))}
          <button
            type="button"
            onClick={() => setAvisos([])}
            className="text-xs text-amber-700 underline"
          >
            ok, entendi
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            draggable
            onDragStart={() => setArrastandoId(foto.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropFoto(foto.id)}
            className={`relative group rounded-md border bg-gray-50 ${
              foto.capa ? "ring-2 ring-brand-goldVivid" : ""
            } ${arrastandoId === foto.id ? "opacity-50" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt=""
              className="w-full h-28 object-contain rounded-md cursor-move"
            />
            {foto.capa && (
              <span className="absolute top-1 left-1 bg-brand-goldVivid text-white text-[10px] px-1.5 py-0.5 rounded">
                Capa
              </span>
            )}
            <button
              type="button"
              onClick={() => excluirFoto(foto.id)}
              className="absolute top-1 right-1 bg-black/70 text-white text-sm w-6 h-6 rounded-full flex items-center justify-center shadow"
              title="Excluir foto"
            >
              ×
            </button>
          </div>
        ))}

        {pendentes.map((p) => (
          <div key={p.chave} className="relative rounded-md border bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="w-full h-28 object-contain rounded-md opacity-60" />
            {p.status === "enviando" && (
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                Enviando...
              </span>
            )}
            {p.status === "erro" && (
              <div className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center p-1 text-center">
                <span className="text-[10px] text-red-700">{p.erro || "Falha ao enviar."}</span>
                <button
                  type="button"
                  onClick={() => removerPendente(p.chave)}
                  className="text-[10px] text-red-600 underline mt-1"
                >
                  remover
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
