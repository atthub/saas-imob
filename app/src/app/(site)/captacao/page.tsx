import { obterImobiliariaAtual } from "@/lib/tenant";
import CaptacaoForm from "./_components/CaptacaoForm";

export const dynamic = "force-dynamic";

export default async function CaptacaoPage() {
  const imobiliaria = await obterImobiliariaAtual();

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-dark mb-2">
          Quero anunciar meu imóvel
        </h1>
        <p className="text-gray-500 text-sm">
          Preencha os dados abaixo e nossa equipe vai avaliar seu imóvel para venda ou locação
          {imobiliaria?.nome ? ` com a ${imobiliaria.nome}` : ""}.
        </p>
      </div>

      <CaptacaoForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
    </section>
  );
}
