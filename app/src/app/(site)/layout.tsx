import { obterImobiliariaAtual } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Topbar from "./_components/Topbar";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import { WhatsappProvider } from "./_components/WhatsappContext";
import WhatsappBotao from "./_components/WhatsappBotao";
import { FavoritosProvider } from "./_components/FavoritosContext";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const imobiliaria = await obterImobiliariaAtual();
  const numeroWhatsappBotao = imobiliaria?.whatsappBotaoNumero || imobiliaria?.whatsapp || "";
  const templateId = imobiliaria?.template?.identificador || "classico";

  // Verifica se há promoções ativas para exibir o link no menu
  const agora = new Date();
  const temPromocoesAtivas = imobiliaria
    ? (await prisma.promocao.count({
        where: {
          imobiliariaId: imobiliaria.id,
          ativo: true,
          OR: [
            { dataInicio: null, dataFim: null },
            { dataInicio: { lte: agora }, dataFim: null },
            { dataInicio: null, dataFim: { gte: agora } },
            { dataInicio: { lte: agora }, dataFim: { gte: agora } },
          ]
        }
      })) > 0
    : false;

  // Campos novos: lidos via $queryRawUnsafe (parâmetros explícitos — forma confiável neste servidor)
  let mcmvHabilitado = false;
  let blogMenuHabilitado = true;
  if (imobiliaria) {
    try {
      const rows = await prisma.$queryRawUnsafe<[{ mcmvHabilitado: number; blogMenuHabilitado: number }]>(
        "SELECT mcmvHabilitado, blogMenuHabilitado FROM imobiliarias WHERE id = ?",
        imobiliaria.id
      );
      mcmvHabilitado     = !!(rows[0]?.mcmvHabilitado);
      blogMenuHabilitado = rows[0]?.blogMenuHabilitado !== undefined ? !!(rows[0]?.blogMenuHabilitado) : true;
    } catch { /* colunas ainda não existem */ }
  }

  return (
    <FavoritosProvider>
    <WhatsappProvider>
      <div className="min-h-screen flex flex-col font-body bg-brand-light" data-template={templateId}>
        <Topbar imobiliaria={imobiliaria} />
        <Navbar imobiliaria={imobiliaria} temPromocoesAtivas={temPromocoesAtivas} mcmvHabilitado={mcmvHabilitado} blogMenuHabilitado={blogMenuHabilitado} />
        <main className="flex-1">{children}</main>
        <Footer imobiliaria={imobiliaria} />
      </div>

      {imobiliaria?.whatsappBotaoAtivo && numeroWhatsappBotao && (
        <WhatsappBotao
          numero={numeroWhatsappBotao}
          mensagemFlutuante={imobiliaria.whatsappBotaoMensagem}
          posicao={imobiliaria.whatsappBotaoPosicao}
          icone={imobiliaria.whatsappBotaoIcone}
        />
      )}
    </WhatsappProvider>
    </FavoritosProvider>
  );
}
