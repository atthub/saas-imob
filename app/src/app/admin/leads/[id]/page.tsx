import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LeadInteracoes from "./_components/LeadInteracoes";
import WhatsappLeadButton from "./_components/WhatsappLeadButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  DIRECIONADO: "Direcionado",
  EM_ATENDIMENTO: "Em atendimento",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido"
};

const STATUS_COR: Record<string, string> = {
  NOVO: "bg-blue-100 text-blue-700",
  DIRECIONADO: "bg-amber-100 text-amber-700",
  EM_ATENDIMENTO: "bg-purple-100 text-purple-700",
  CONVERTIDO: "bg-green-100 text-green-700",
  PERDIDO: "bg-gray-100 text-gray-500"
};

export default async function LeadDetalhePage({ params }: { params: { id: string } }) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    include: {
      imovel: { select: { id: true, titulo: true, codigo: true } },
      corretor: { select: { id: true, nome: true } }
    }
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{lead.nome}</h1>
          <p className="text-sm text-gray-500">{lead.telefone}{lead.cidade ? ` · ${lead.cidade}` : ""}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`inline-block text-xs font-semibold rounded-full px-3 py-1 ${STATUS_COR[lead.status] || "bg-gray-100"}`}>
            {STATUS_LABEL[lead.status] || lead.status}
          </span>
          <WhatsappLeadButton
            lead={{
              nome: lead.nome,
              telefone: lead.telefone,
              imovelTitulo: lead.imovel?.titulo || null
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Dados do lead */}
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-brand-dark">Informações</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Imóvel de interesse</dt>
              <dd className="font-medium text-brand-dark">
                {lead.imovel
                  ? `${lead.imovel.codigo} — ${lead.imovel.titulo}`
                  : "Contato geral"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Corretor</dt>
              <dd>{lead.corretor?.nome || "Não direcionado"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Origem</dt>
              <dd className="capitalize">{lead.origem}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Cadastrado em</dt>
              <dd>{new Date(lead.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd>
            </div>
          </dl>
          {lead.mensagem && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Mensagem</p>
              <p className="text-sm bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{lead.mensagem}</p>
            </div>
          )}
          {lead.observacoes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Observações</p>
              <p className="text-sm bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{lead.observacoes}</p>
            </div>
          )}
        </div>

        {/* Histórico de interações */}
        {/* interacoesIniciais vazio — componente busca via API ao montar */}
        <LeadInteracoes leadId={params.id} interacoesIniciais={[]} />
      </div>
    </div>
  );
}
