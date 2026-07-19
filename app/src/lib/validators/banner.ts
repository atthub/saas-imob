import { z } from "zod";

export const bannerSchema = z.object({
  titulo: z.string().optional().nullable(),
  urlDesktop: z.string().min(1, "Envie a imagem do banner."),
  urlMobile: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true)
});

export type BannerInput = z.infer<typeof bannerSchema>;
