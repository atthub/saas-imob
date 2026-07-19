import ArtigoForm from "../_components/ArtigoForm";

export default function NovoBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Novo artigo</h1>
        <p className="text-sm text-gray-500">Crie um novo artigo para o blog do site público.</p>
      </div>
      <ArtigoForm />
    </div>
  );
}
