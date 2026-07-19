import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { notFound } from "next/navigation";
import EditarLandingPageForm from "./_components/EditarLandingPageForm";

interface Props {
  params: { id: string };
}

export default async function EditarLandingPagePage({ params }: Props) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const lp = await prisma.landingPage.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId },
    include: {
      imovel: {
        select: {
          codigo: true,
          titulo: true,
          descricao: true,
          fotos: { where: { capa: true }, take: 1, select: { url: true } }
        }
      }
    }
  });

  if (!lp) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Editar Landing Page</h1>
        <p className="text-sm text-gray-500">
          {lp.imovel.codigo} – {lp.imovel.titulo}
        </p>
      </div>
      <EditarLandingPageForm landingPage={{
        id: lp.id,
        slug: lp.slug,
        titulo: lp.titulo,
        descricao: lp.descricao,
        cta: lp.cta,
        status: lp.status
      }} />
    </div>
  );
}
