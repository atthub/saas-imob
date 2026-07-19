import { z } from "zod";

export const corretorSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres."),
  telefone: z.string().min(8, "Informe um telefone válido."),
  whatsapp: z.string().optional().nullable(),
  email: z
    .string()
    .email("E-mail inválido.")
    .optional()
    .nullable()
    .or(z.literal("")),
  creci: z.string().optional().nullable(),
  ativo: z.boolean().default(true)
});

export type CorretorInput = z.infer<typeof corretorSchema>;
