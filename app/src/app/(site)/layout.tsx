import { obterImobiliariaAtual } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getConfigs } from "@/lib/config";
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
  // Usa $queryRaw para não depender de o Prisma Client ter o model Promocao gerado
  let temPromocoesAtivas = false;
  if (imobiliaria) {
    try {
      const agora = new Date();
      const rows = await prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COUNT(*) AS total FROM promocoes
        WHERE imobiliariaId = ${imobiliaria.id}
          AND ativo = 1
          AND (
            (dataInicio IS NULL AND dataFim IS NULL)
            OR (dataInicio <= ${agora} AND dataFim IS NULL)
            OR (dataInicio IS NULL AND dataFim >= ${agora})
            OR (dataInicio <= ${agora} AND dataFim >= ${agora})
          )
      `;
      temPromocoesAtivas = Number(rows[0]?.total ?? 0) > 0;
    } catch {
      temPromocoesAtivas = false;
    }
  }

  // Todos os toggles lidos da tabela chave-valor configuracoes_imobiliaria
  let mcmvHabilitado = false;
  let blogMenuHabilitado = true;
  if (imobiliaria) {
    const cfgs = await getConfigs(imobiliaria.id, ["mcmvHabilitado", "blogMenuHabilitado"]);
    mcmvHabilitado    = cfgs["mcmvHabilitado"]    === "true";
    blogMenuHabilitado = cfgs["blogMenuHabilitado"] !== "false" && cfgs["blogMenuHabilitado"] !== "0"; // default true
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
