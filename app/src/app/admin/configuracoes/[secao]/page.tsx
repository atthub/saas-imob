import { redirect } from "next/navigation";

// Redireciona /admin/configuracoes/[secao] → /admin/configuracoes?secao=[secao]
export default function ConfiguracaoSecaoPage({
  params,
}: {
  params: { secao: string };
}) {
  redirect(`/admin/configuracoes?secao=${params.secao}`);
}
