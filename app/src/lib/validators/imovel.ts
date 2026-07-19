import { z } from "zod";

export const imovelSchema = z.object({
  codigo: z.string().optional().nullable(),
  codigoAutomatico: z.boolean().default(true),
  titulo: z.string().min(3, "O título precisa ter pelo menos 3 caracteres."),
  descricao: z.string().optional().nullable(),
  tipo: z.enum([
    "CASA",
    "APARTAMENTO",
    "TERRENO",
    "SALA_COMERCIAL",
    "GALPAO",
    "CHACARA",
    "KITNET",
    "ESPACO_FESTAS",
    "OUTRO"
  ]),
  finalidade: z.enum(["VENDA", "LOCACAO", "VENDA_E_LOCACAO"]),
  status: z
    .enum(["DISPONIVEL", "RESERVADO", "VENDIDO", "ALUGADO", "INATIVO"])
    .default("DISPONIVEL"),

  // z.coerce.number() converte "" em 0 (Number("") === 0), não em null —
  // por isso tratamos string vazia/null/undefined como "sem valor" antes
  // de coagir para número, igual já era feito com as datas de contrato.
  valorVenda: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  valorLocacao: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  valorCondominio: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  valorIptu: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),

  areaTotal: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  areaConstruida: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  quartos: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().optional().nullable()),
  suites: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().optional().nullable()),
  banheiros: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().optional().nullable()),
  vagasGaragem: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().optional().nullable()),

  endereco: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  cidadeId: z.string().optional().nullable(),
  bairroId: z.string().optional().nullable(),
  latitude: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  longitude: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().optional().nullable()),
  exibirMapa: z.boolean().default(true),

  destaque: z.boolean().default(false),

  // Dados do proprietário — uso interno, todos opcionais.
  proprietarioNome: z.string().optional().nullable(),
  proprietarioTelefone: z.string().optional().nullable(),
  // Aceita qualquer string — validação de formato feita pelo campo type="email" no front-end.
  // Usar .email() aqui bloquearia edições quando o banco contém e-mails em formato legado.
  proprietarioEmail: z.string().optional().nullable(),
  proprietarioObs: z.string().optional().nullable(),

  // Dados do locatário — preenchidos quando o imóvel está alugado.
  locatarioNome: z.string().optional().nullable(),
  locatarioTelefone: z.string().optional().nullable(),
  locatarioEmail: z.string().optional().nullable(),
  locatarioObs: z.string().optional().nullable(),
  // Datas chegam do formulário como string ("" quando vazio); tratamos "" e
  // null/undefined como "sem data" antes de tentar converter para Date.
  contratoInicio: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().optional().nullable()
  ),
  contratoFim: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().optional().nullable()
  ),

  caracteristicaIds: z.array(z.string()).default([]),
  condominioCaracteristicaIds: z.array(z.string()).default([])
}).superRefine((data, ctx) => {
  if ((data.finalidade === "VENDA" || data.finalidade === "VENDA_E_LOCACAO") && !data.valorVenda) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o valor de venda.", path: ["valorVenda"] });
  }
  if ((data.finalidade === "LOCACAO" || data.finalidade === "VENDA_E_LOCACAO") && !data.valorLocacao) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o valor de locação.", path: ["valorLocacao"] });
  }
  if (!data.codigoAutomatico && (!data.codigo || data.codigo.trim().length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o código do imóvel.", path: ["codigo"] });
  }
});

export type ImovelInput = z.infer<typeof imovelSchema>;
