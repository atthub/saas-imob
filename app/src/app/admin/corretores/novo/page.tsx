import CorretorForm from "../_components/CorretorForm";

export default function NovoCorretorPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-dark">Novo corretor</h1>
      <CorretorForm modo="criar" />
    </div>
  );
}
