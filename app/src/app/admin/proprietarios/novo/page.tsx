import Link from "next/link";
import NovoProprietarioForm from "./_components/NovoProprietarioForm";

export default function NovoProprietarioPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/admin/proprietarios" className="text-sm text-brand-gold hover:underline">
          ← Voltar para Proprietários
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Novo proprietário</h1>
        <p className="text-sm text-gray-500">Cadastre um proprietário para depois vinculá-lo a imóveis.</p>
      </div>
      <NovoProprietarioForm />
    </div>
  );
}
