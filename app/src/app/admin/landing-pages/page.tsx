import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import ExcluirLandingPageButton from "./_components/ExcluirLandingPageButton";

export default async function LandingPagesPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const landingPages = await prisma.landingPage.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    include: {
      imovel: {
        select: {
          codigo: true,
          titulo: true,
          fotos: { where: { capa: true }, take: 1, select: { url: true } }
        }
      }
    },
    orderBy: { criadoEm: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Landing Pages</h1>
        <p className="text-sm text-gray-500">
          Todas as landing pages exclusivas já geradas para seus imóveis. Para criar uma nova, abra o imóvel
          desejado e clique em &quot;Landing Page Exclusiva&quot;.
        </p>
      </div>

      {landingPages.length === 0 && (
        <div className="border border-dashed rounded-xl p-10 text-center text-gray-400 text-sm">
          <p className="font-medium mb-1">Nenhuma landing page criada ainda.</p>
          <p>
            Acesse um{" "}
            <Link href="/admin/imoveis" className="text-brand-gold hover:underline font-medium">
              imóvel
            </Link>{" "}
            e clique em &quot;Landing Page Exclusiva&quot; para criar uma.
          </p>
        </div>
      )}

      {landingPages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {landingPages.map((lp) => {
              const foto = lp.imovel.fotos[0]?.url;
              return (
                <div key={lp.id} className="flex items-center gap-4 p-4">
                  <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-brand-dark truncate">
                      {lp.imovel.codigo} – {lp.imovel.titulo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lp.imovel.codigo} ·{" "}
                      <span
                        className={`font-medium ${
                          lp.status === "publicada" ? "text-green-600" : "text-amber-500"
                        }`}
                      >
                        {lp.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lp.status === "publicada" && (
                      <a
                        href={`/lp/${lp.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver landing page"
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-brand-dark transition"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <Link
                      href={`/admin/landing-pages/${lp.id}`}
                      title="Editar landing page"
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-brand-dark transition"
                    >
                      <Pencil size={16} />
                    </Link>
                    <ExcluirLandingPageButton id={lp.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
