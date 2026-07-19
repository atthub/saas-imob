import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import BannerUploadForm from "./_components/BannerUploadForm";
import ListaBanners from "./_components/ListaBanners";

export default async function BannersPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return null;

  const banners = await prisma.banner.findMany({
    where: { imobiliariaId: sessao.imobiliariaId },
    orderBy: { ordem: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Banners do slider (hero)</h1>
        <p className="text-sm text-gray-500">
          Essas imagens aparecem em rotação na faixa principal da página inicial do site público.
          Use fotos na horizontal, de preferência com pelo menos 1600px de largura.
        </p>
      </div>

      <BannerUploadForm />
      <ListaBanners
        banners={banners.map((b) => ({
          id: b.id,
          titulo: b.titulo,
          urlDesktop: b.urlDesktop,
          link: b.link,
          ordem: b.ordem,
          ativo: b.ativo
        }))}
      />
    </div>
  );
}
