import { prisma } from "./prisma";

/**
 * Remove tudo que não for dígito de um telefone, para comparar números
 * digitados em formatos diferentes (com/sem DDD, parênteses, espaços...).
 */
export function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

/**
 * Busca um Proprietario já cadastrado na imobiliária pelo telefone (mesma
 * pessoa pode aparecer em mais de uma captação/imóvel). Se não encontrar,
 * cria um novo cadastro. Usado ao aceitar uma captação, e pode ser
 * reaproveitado em outros fluxos de vínculo manual.
 */
export async function encontrarOuCriarProprietario(params: {
  imobiliariaId: string;
  nome: string;
  telefone: string;
  email?: string | null;
  observacoes?: string | null;
}) {
  const { imobiliariaId, nome, telefone, email, observacoes } = params;
  const telefoneNormalizado = normalizarTelefone(telefone);

  const existentes = await prisma.proprietario.findMany({ where: { imobiliariaId } });
  const encontrado = telefoneNormalizado
    ? existentes.find((p) => normalizarTelefone(p.telefone) === telefoneNormalizado)
    : undefined;

  if (encontrado) {
    // Preenche dados que estavam faltando no cadastro existente, sem
    // sobrescrever informações já preenchidas anteriormente.
    const precisaAtualizar =
      (!encontrado.email && email) || (!encontrado.observacoes && observacoes);
    if (precisaAtualizar) {
      return prisma.proprietario.update({
        where: { id: encontrado.id },
        data: {
          email: encontrado.email || email || undefined,
          observacoes: encontrado.observacoes || observacoes || undefined
        }
      });
    }
    return encontrado;
  }

  return prisma.proprietario.create({
    data: { imobiliariaId, nome, telefone, email: email || undefined, observacoes: observacoes || undefined }
  });
}
