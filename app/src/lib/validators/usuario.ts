import { z } from "zod";

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha.")
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: "A confirmação não corresponde à nova senha.",
    path: ["confirmarSenha"]
  });

export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;

const moduloEnum = z.enum([
  "imoveis",
  "leads",
  "corretores",
  "captacoes",
  "proprietarios",
  "banners",
  "configuracoes",
  "usuarios"
]);

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  papel: z.enum(["ADMIN", "CORRETOR"]),
  permissoes: z.array(moduloEnum).default([])
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const editarUsuarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  papel: z.enum(["ADMIN", "CORRETOR"]),
  permissoes: z.array(moduloEnum).default([])
});

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
