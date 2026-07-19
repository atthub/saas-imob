import { z } from "zod";

export const captacaoSchema = z.object({
  nomeProprietario: z.string().min(2, "Informe seu nome."),
  telefone: z.string().min(8, "Informe um telefone válido."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")).nullable(),
  tipoImovel: z.string().optional().nullable(),
  finalidade: z.enum(["venda", "locacao", "ambos"]).optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  bairro: z.string().max(100).optional().nullable(),
  valorPretendido: z.string().max(50).optional().nullable(),
  descricao: z.string().max(2000).optional().nullable(),
  fotos: z.array(z.string()).max(10, "Envie no máximo 10 fotos.").optional(),
  turnstileToken: z.string().min(1, "Confirme que você não é um robô.")
});

export type CaptacaoInput = z.infer<typeof captacaoSchema>;
