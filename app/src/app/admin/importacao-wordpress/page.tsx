import { obterSessaoAtual } from "@/lib/session";
import { redirect } from "next/navigation";
import ImportadorWordpress from "./_components/ImportadorWordpress";

export const dynamic = "force-dynamic";

export default async function ImportacaoWordpressPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao || (sessao.papel !== "SUPER_ADMIN" && sessao.papel !== "ADMIN")) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-dark">Importação do WordPress</h1>
        <p className="text-sm text-gray-500">
          Traz os anúncios do site antigo (plugin Classified Listing) para este sistema, com fotos.
          Pode rodar em vários lotes e a qualquer momento — anúncios já importados não são duplicados.
        </p>
      </div>

      <ImportadorWordpress />
    </div>
  );
}
