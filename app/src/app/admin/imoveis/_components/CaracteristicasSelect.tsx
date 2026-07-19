"use client";

import { useEffect, useState } from "react";
import { iconeDaCaracteristica } from "@/lib/icones";

type Item = { id: string; nome: string };

type Props = {
  endpoint: "caracteristicas" | "caracteristicas-condominio";
  selecionados: string[];
  onChange: (ids: string[]) => void;
  titulo: string;
};

export default function CaracteristicasSelect({ endpoint, selecionados, onChange, titulo }: Props) {
  const [itens, setItens] = useState<Item[]>([]);
  const [novoItem, setNovoItem] = useState("");

  async function carregar() {
    const resposta = await fetch(`/api/${endpoint}`);
    const data = await resposta.json();
    setItens(data.caracteristicas || []);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternar(id: string) {
    if (selecionados.includes(id)) {
      onChange(selecionados.filter((x) => x !== id));
    } else {
      onChange([...selecionados, id]);
    }
  }

  async function adicionarNovo() {
    const nomeDigitado = novoItem.trim();
    if (!nomeDigitado) return;

    // Antes de criar, verifica se já existe um item parecido (ignorando
    // maiúsculas/minúsculas e espaços nas pontas) para não gerar duplicidade
    // só por diferença de digitação (ex.: "Piscina" vs "piscina ").
    const existente = itens.find(
      (item) => item.nome.trim().toLowerCase() === nomeDigitado.toLowerCase()
    );

    if (existente) {
      const usarExistente = confirm(
        `Já existe a característica "${existente.nome}". Deseja usar essa em vez de criar uma nova?\n\n` +
          `OK = usar "${existente.nome}"\nCancelar = criar "${nomeDigitado}" mesmo assim`
      );
      setNovoItem("");
      if (usarExistente) {
        if (!selecionados.includes(existente.id)) {
          onChange([...selecionados, existente.id]);
        }
        return;
      }
      // Admin confirmou que quer criar mesmo assim; segue o fluxo normal.
    }

    const resposta = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeDigitado })
    });
    const data = await resposta.json();
    setNovoItem("");
    await carregar();
    const novoId = data.caracteristica?.id;
    if (novoId) onChange([...selecionados, novoId]);
  }

  return (
    <div>
      <p className="text-sm font-semibold text-brand-dark mb-2">{titulo}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {itens.map((item) => {
          const ativo = selecionados.includes(item.id);
          const Icone = iconeDaCaracteristica(item.nome);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => alternar(item.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                ativo
                  ? "bg-brand-goldVivid text-white border-brand-goldVivid"
                  : "bg-white text-gray-600 border-gray-300 hover:border-brand-goldVivid"
              }`}
            >
              <Icone className="w-3.5 h-3.5" />
              {item.nome}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          placeholder="Adicionar novo item..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={adicionarNovo}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
