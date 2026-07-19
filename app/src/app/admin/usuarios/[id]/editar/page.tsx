import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/session";
import { permissoesPadrao } from "@/lib/permissoes";
import UsuarioForm from "../../_components/UsuarioForm";

type Params = { params: { id: string } };

export default async function EditarUsuarioPage({ params }: Params) {
  const sessao = await obterSessaoAtual();
  if (!sessao || !sessao.imobiliariaId) return notFound();

  const usuario = await prisma.usuario.findFirst({
    where: { id: params.id, imobiliariaId: sessao.imobiliariaId }
  });
  if (!usuario) return notFound();

  const permissoes = Array.isArray(usuario.permissoes)
    ? (usuario.permissoes as string[])
    : permissoesPadrao(usuario.papel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Editar usuário</h1>
        <p className="text-sm text-gray-500">{usuario.email}</p>
      </div>
      <UsuarioForm
        modo="editar"
        usuarioId={usuario.id}
        valoresIniciais={{
          nome: usuario.nome,
          papel: usuario.papel as "ADMIN" | "CORRETOR",
          permissoes
        }}
      />
    </div>
  );
}
