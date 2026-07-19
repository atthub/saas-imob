import { z } from "zod";

export const leadSchema = z.object({
  nome: z.string().min(2, "Informe seu nome."),
  telefone: z.string().min(8, "Informe um telefone válido."),
  cidade: z.string().optional().nullable(),
  mensagem: z.string().optional().nullable(),
  imovelId: z.string().optional().nullable(),
  imobiliariaId: z.string().min(1, "Imobiliária não identificada."),
  turnstileToken: z.string().optional().nullable()
});

export type LeadInput = z.infer<typeof leadSchema>;
