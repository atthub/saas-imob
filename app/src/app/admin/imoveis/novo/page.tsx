import ImovelForm from "../_components/ImovelForm";

export default function NovoImovelPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-dark">Novo imóvel</h1>
      <ImovelForm />
    </div>
  );
}
