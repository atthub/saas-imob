import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CorretorForm from "../../_components/CorretorForm";

export default async function EditarCorretorPage({ params }: { params: { id: string } }) {
  const corretor = await prisma.corretor.findUnique({ where: { id: params.id } });
  if (!corretor) return notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-dark">Editar corretor</h1>
      <CorretorForm
        modo="editar"
        corretorId={corretor.id}
        valoresIniciais={{
          nome: corretor.nome,
          telefone: corretor.telefone,
          whatsapp: corretor.whatsapp || "",
          email: corretor.email || "",
          creci: corretor.creci || "",
          ativo: corretor.ativo
        }}
      />
    </div>
  );
}
