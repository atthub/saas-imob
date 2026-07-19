import UsuarioForm from "../_components/UsuarioForm";

export default function NovoUsuarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Novo usuário</h1>
        <p className="text-sm text-gray-500">Cadastre um novo acesso ao painel e defina suas permissões.</p>
      </div>
      <UsuarioForm modo="criar" />
    </div>
  );
}
