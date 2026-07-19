"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import CaracteristicasSelect from "./CaracteristicasSelect";
import CidadeBairroSelect from "./CidadeBairroSelect";
import FotosUploader from "./FotosUploader";
import ModalSucesso from "../../_components/ModalSucesso";
import { Ruler, Bed, BedDouble, Bath, Car, CheckCircle2, Clock, Tag, KeyRound, EyeOff, Save } from "lucide-react";

const MapaSeletor = dynamic(() => import("./MapaSeletor"), { ssr: false });

const TIPOS = [
  ["CASA", "Casa"],
  ["APARTAMENTO", "Apartamento"],
  ["TERRENO", "Terreno"],
  ["SALA_COMERCIAL", "Sala Comercial"],
  ["GALPAO", "Galpão"],
  ["CHACARA", "Chácara"],
  ["KITNET", "Kitnet"],
  ["ESPACO_FESTAS", "Espaço de Festas"],
  ["OUTRO", "Outro"]
];

const STATUS_OPCOES = [
  {
    valor: "DISPONIVEL",
    label: "Disponível",
    icone: CheckCircle2,
    cor: "border-green-400 bg-green-50 text-green-700",
    corAtivo: "border-green-500 bg-green-100 ring-2 ring-green-400"
  },
  {
    valor: "RESERVADO",
    label: "Reservado",
    icone: Clock,
    cor: "border-amber-400 bg-amber-50 text-amber-700",
    corAtivo: "border-amber-500 bg-amber-100 ring-2 ring-amber-400"
  },
  {
    valor: "VENDIDO",
    label: "Vendido",
    icone: Tag,
    cor: "border-blue-400 bg-blue-50 text-blue-700",
    corAtivo: "border-blue-500 bg-blue-100 ring-2 ring-blue-400"
  },
  {
    valor: "ALUGADO",
    label: "Alugado",
    icone: KeyRound,
    cor: "border-orange-400 bg-orange-50 text-orange-700",
    corAtivo: "border-orange-500 bg-orange-100 ring-2 ring-orange-400"
  },
  {
    valor: "INATIVO",
    label: "Inativo",
    icone: EyeOff,
    cor: "border-gray-300 bg-gray-50 text-gray-500",
    corAtivo: "border-gray-400 bg-gray-100 ring-2 ring-gray-400"
  }
];

export type ImovelFormValues = {
  id?: string;
  codigo: string;
  codigoAutomatico: boolean;
  titulo: string;
  descricao: string;
  tipo: string;
  finalidade: "VENDA" | "LOCACAO" | "VENDA_E_LOCACAO";
  status: string;
  valorVenda: string;
  valorLocacao: string;
  valorCondominio: string;
  valorIptu: string;
  areaTotal: string;
  areaConstruida: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagasGaragem: string;
  cidadeId: string;
  bairroId: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  exibirMapa: boolean;
  destaque: boolean;
  proprietarioNome: string;
  proprietarioTelefone: string;
  proprietarioEmail: string;
  proprietarioObs: string;
  locatarioNome: string;
  locatarioTelefone: string;
  locatarioEmail: string;
  locatarioObs: string;
  contratoInicio: string;
  contratoFim: string;
  caracteristicaIds: string[];
  condominioCaracteristicaIds: string[];
};

const valoresIniciais: ImovelFormValues = {
  codigo: "",
  codigoAutomatico: true,
  titulo: "",
  descricao: "",
  tipo: "CASA",
  finalidade: "VENDA",
  status: "DISPONIVEL",
  valorVenda: "",
  valorLocacao: "",
  valorCondominio: "",
  valorIptu: "",
  areaTotal: "",
  areaConstruida: "",
  quartos: "",
  suites: "",
  banheiros: "",
  vagasGaragem: "",
  cidadeId: "",
  bairroId: "",
  endereco: "",
  numero: "",
  complemento: "",
  cep: "",
  latitude: null,
  longitude: null,
  exibirMapa: true,
  destaque: false,
  proprietarioNome: "",
  proprietarioTelefone: "",
  proprietarioEmail: "",
  proprietarioObs: "",
  locatarioNome: "",
  locatarioTelefone: "",
  locatarioEmail: "",
  locatarioObs: "",
  contratoInicio: "",
  contratoFim: "",
  caracteristicaIds: [],
  condominioCaracteristicaIds: []
};

export default function ImovelForm({ inicial }: { inicial?: Partial<ImovelFormValues> }) {
  const router = useRouter();
  const [valores, setValores] = useState<ImovelFormValues>({ ...valoresIniciais, ...inicial });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function set<K extends keyof ImovelFormValues>(campo: K, valor: ImovelFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = { ...valores };
    const url = valores.id ? `/api/imoveis/${valores.id}` : "/api/imoveis";
    const metodo = valores.id ? "PUT" : "POST";

    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSalvando(false);

    if (!resposta.ok) {
      const data = await resposta.json().catch(() => ({}));
      const mensagens: string[] = data?.detalhes?.fieldErrors
        ? Object.values(data.detalhes.fieldErrors as Record<string, string[]>)
            .flat()
            .filter(Boolean)
        : [];
      const mensagemFinal = mensagens.length
        ? `${data.erro || "Dados inválidos."} ${mensagens.join(" ")}`
        : data.erro || "Não foi possível salvar o imóvel.";
      setErro(mensagemFinal);
      return;
    }

    setSucesso(true);

    if (!valores.id) {
      const data = await resposta.json();
      // Mostra a confirmação por um instante antes de navegar para a tela de
      // edição, senão a troca de página faria o quadro desaparecer na hora.
      setTimeout(() => router.push(`/admin/imoveis/${data.imovel.id}/editar`), 1200);
    } else {
      router.refresh();
    }
  }

  const precisaValorVenda = valores.finalidade === "VENDA" || valores.finalidade === "VENDA_E_LOCACAO";
  const precisaValorLocacao = valores.finalidade === "LOCACAO" || valores.finalidade === "VENDA_E_LOCACAO";

  return (
    <form onSubmit={salvar} className="space-y-8 max-w-3xl pb-24">
      <ModalSucesso aberto={sucesso} mensagem="Imóvel salvo com sucesso!" onClose={() => setSucesso(false)} />
      {erro && <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">{erro}</div>}

      {/* Dados básicos */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Dados básicos</h2>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={valores.codigoAutomatico}
              onChange={(e) => set("codigoAutomatico", e.target.checked)}
            />
            Código automático
          </label>
          {!valores.codigoAutomatico && (
            <input
              value={valores.codigo}
              onChange={(e) => set("codigo", e.target.value)}
              placeholder="Código do imóvel"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            />
          )}
          {valores.codigoAutomatico && valores.id && (
            <span className="text-sm text-gray-500">Código atual: {valores.codigo}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do anúncio</label>
          <input
            required
            value={valores.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Ex: Casa 3 quartos no Vila São Benedito"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={valores.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de imóvel</label>
          <select
            value={valores.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {TIPOS.map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Status — seletor visual com ícones */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status do imóvel
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPCOES.map(({ valor, label, icone: Icone, cor, corAtivo }) => {
              const ativo = valores.status === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => set("status", valor)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${ativo ? corAtivo : cor} hover:opacity-90`}
                >
                  <Icone className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={valores.destaque} onChange={(e) => set("destaque", e.target.checked)} />
          Marcar como imóvel em destaque
        </label>
      </section>

      {/* Finalidade e valores */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Finalidade e valores</h2>

        <div className="flex gap-4">
          {[
            ["VENDA", "Venda"],
            ["LOCACAO", "Locação"],
            ["VENDA_E_LOCACAO", "Ambos"]
          ].map(([valor, label]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="finalidade"
                checked={valores.finalidade === valor}
                onChange={() => set("finalidade", valor as ImovelFormValues["finalidade"])}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {precisaValorVenda && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor de venda (R$)</label>
              <input
                type="number"
                value={valores.valorVenda}
                onChange={(e) => set("valorVenda", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
          {precisaValorLocacao && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor de locação (R$/mês)</label>
              <input
                type="number"
                value={valores.valorLocacao}
                onChange={(e) => set("valorLocacao", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condomínio (R$)</label>
            <input
              type="number"
              value={valores.valorCondominio}
              onChange={(e) => set("valorCondominio", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPTU (R$)</label>
            <input
              type="number"
              value={valores.valorIptu}
              onChange={(e) => set("valorIptu", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Área e cômodos */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Área e cômodos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><Ruler className="w-4 h-4 text-brand-goldVivid" /> Área total (m²)</label>
            <input
              type="number"
              value={valores.areaTotal}
              onChange={(e) => set("areaTotal", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><Ruler className="w-4 h-4 text-brand-goldVivid" /> Área construída (m²)</label>
            <input
              type="number"
              value={valores.areaConstruida}
              onChange={(e) => set("areaConstruida", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><Bed className="w-4 h-4 text-brand-goldVivid" /> Quartos</label>
            <input
              type="number"
              value={valores.quartos}
              onChange={(e) => set("quartos", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><BedDouble className="w-4 h-4 text-brand-goldVivid" /> Suítes</label>
            <input
              type="number"
              value={valores.suites}
              onChange={(e) => set("suites", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><Bath className="w-4 h-4 text-brand-goldVivid" /> Banheiros</label>
            <input
              type="number"
              value={valores.banheiros}
              onChange={(e) => set("banheiros", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"><Car className="w-4 h-4 text-brand-goldVivid" /> Vagas de garagem</label>
            <input
              type="number"
              value={valores.vagasGaragem}
              onChange={(e) => set("vagasGaragem", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="bg-white rounded-xl shadow p-5 space-y-6">
        <CaracteristicasSelect
          endpoint="caracteristicas"
          titulo="Características do imóvel (Suíte, Closet, Piscina...)"
          selecionados={valores.caracteristicaIds}
          onChange={(ids) => set("caracteristicaIds", ids)}
        />
        <CaracteristicasSelect
          endpoint="caracteristicas-condominio"
          titulo="Características do condomínio (caso aplicável)"
          selecionados={valores.condominioCaracteristicaIds}
          onChange={(ids) => set("condominioCaracteristicaIds", ids)}
        />
      </section>

      {/* Endereço e mapa */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Endereço e localização</h2>

        <CidadeBairroSelect
          cidadeId={valores.cidadeId}
          bairroId={valores.bairroId}
          onChange={(cidadeId, bairroId) => {
            set("cidadeId", cidadeId);
            set("bairroId", bairroId);
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              value={valores.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              value={valores.numero}
              onChange={(e) => set("numero", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <input
              value={valores.cep}
              onChange={(e) => set("cep", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={valores.exibirMapa} onChange={(e) => set("exibirMapa", e.target.checked)} />
          Exibir mapa na página pública do imóvel
        </label>

        <MapaSeletor
          latitude={valores.latitude}
          longitude={valores.longitude}
          onChange={(lat, lng) => {
            set("latitude", lat);
            set("longitude", lng);
          }}
        />
      </section>

      {/* Dados do proprietário — uso interno, nunca aparece no site público */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-brand-dark">Dados do proprietário</h2>
        <p className="text-xs text-gray-400">
          Informações internas para uso da equipe. Não são exibidas na vitrine pública do imóvel.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do proprietário</label>
            <input
              value={valores.proprietarioNome}
              onChange={(e) => set("proprietarioNome", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone do proprietário</label>
            <input
              value={valores.proprietarioTelefone}
              onChange={(e) => set("proprietarioTelefone", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do proprietário</label>
            <input
              type="email"
              value={valores.proprietarioEmail}
              onChange={(e) => set("proprietarioEmail", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações sobre o proprietário</label>
            <textarea
              value={valores.proprietarioObs}
              onChange={(e) => set("proprietarioObs", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Dados do locatário — só relevante quando o imóvel está/será alugado */}
      {precisaValorLocacao && (
        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-brand-dark">Dados do locatário</h2>
          <p className="text-xs text-gray-400">
            Preencha quando o imóvel estiver alugado. Informações internas, não aparecem na vitrine pública.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do locatário</label>
              <input
                value={valores.locatarioNome}
                onChange={(e) => set("locatarioNome", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone do locatário</label>
              <input
                value={valores.locatarioTelefone}
                onChange={(e) => set("locatarioTelefone", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do locatário</label>
              <input
                type="email"
                value={valores.locatarioEmail}
                onChange={(e) => set("locatarioEmail", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início do contrato</label>
              <input
                type="date"
                value={valores.contratoInicio}
                onChange={(e) => set("contratoInicio", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim do contrato</label>
              <input
                type="date"
                value={valores.contratoFim}
                onChange={(e) => set("contratoFim", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações sobre o locatário</label>
              <textarea
                value={valores.locatarioObs}
                onChange={(e) => set("locatarioObs", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>
      )}

      {/* Fotos */}
      {valores.id && (
        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-brand-dark">Fotos do imóvel</h2>
          <FotosUploader imovelId={valores.id} />
        </section>
      )}
      {!valores.id && (
        <section className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">
            Salve o imóvel primeiro para liberar o envio de fotos e vídeos.
          </p>
        </section>
      )}

      {/* Barra fixa de salvar — sempre visível, não precisa rolar até o fim */}
      <div className="fixed bottom-0 left-60 right-0 z-30 bg-white border-t shadow-[0_-2px_12px_rgba(0,0,0,0.08)] px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400 hidden sm:block">
          {valores.titulo ? `Editando: ${valores.titulo}` : "Novo imóvel"}
        </p>
        {erro && <span className="text-red-600 text-sm line-clamp-1 flex-1">{erro}</span>}
        <button
          type="submit"
          disabled={salvando}
          className="ml-auto flex items-center gap-2 bg-brand-goldVivid text-white font-semibold px-5 py-2.5 rounded-md hover:opacity-90 disabled:opacity-60 transition shrink-0"
        >
          <Save className="w-4 h-4" />
          {salvando ? "Salvando..." : "Salvar imóvel"}
        </button>
      </div>
    </form>
  );
}
