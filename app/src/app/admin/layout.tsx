import PwaInstallButton from "@/app/_components/PwaInstallButton";
import { obterSessaoAtual } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getConfigs } from "@/lib/config";
import UserDropdown from "./_components/UserDropdown";
import AdminSidebar from "./_components/AdminSidebar";

export const dynamic = "force-dynamic";

type SubItem = { href: string; label: string; modulo: string | null };
type TodoItem = {
  href: string;
  label: string;
  modulo: string | null;
  subItems?: SubItem[];
};

const TODOS_ITENS: TodoItem[] = [
  { href: "/admin", label: "Dashboard", modulo: null },

  // Imóveis agrupa "Todos" + "Captações" num único accordion
  {
    href: "/admin/imoveis",
    label: "Imóveis",
    modulo: null, // visibilidade determinada pelos subitens
    subItems: [
      { href: "/admin/imoveis",   label: "Todos os imóveis",    modulo: "imoveis" },
      { href: "/admin/captacoes", label: "Captação de imóveis", modulo: "captacoes" },
    ],
  },

  { href: "/admin/leads",           label: "Leads",           modulo: "leads" },
  { href: "/admin/corretores",      label: "Corretores",      modulo: "corretores" },
  { href: "/admin/proprietarios",   label: "Proprietários",   modulo: "proprietarios" },
  { href: "/admin/usuarios",        label: "Usuários",        modulo: "usuarios" },
  { href: "/admin/comissoes",       label: "Comissões",       modulo: "comissoes" },
  { href: "/admin/promocoes",       label: "Promoções",       modulo: "promocoes" },
  { href: "/admin/blog",            label: "Blog",            modulo: "blog" },
  { href: "/admin/landing-pages",   label: "Landing Pages",   modulo: "landing_pages" },

  // Configurações: subitens via searchParam ?secao=xxx (mesma page.tsx)
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    modulo: "configuracoes",
    subItems: [
      { href: "/admin/configuracoes?secao=identidade",         label: "Identidade visual",     modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=templates",          label: "Templates e cores",     modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=contato",            label: "Contato e localização", modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=redes",              label: "Redes Sociais",         modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=marca-dagua",        label: "Marca D'água",          modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=whatsapp",           label: "WhatsApp flutuante",    modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=paginacao",          label: "Paginação e destaque",  modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=portais",            label: "Portais (XML)",         modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=whatsapp-templates", label: "Templates WhatsApp",    modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=banners",            label: "Banners",               modulo: "configuracoes" },
      { href: "/admin/configuracoes?secao=importar",           label: "Importar dados",        modulo: "configuracoes" },
    ],
  },

  { href: "/admin/auditoria",           label: "Auditoria",             modulo: "auditoria" },
  { href: "/admin/plataforma",          label: "Plataforma",            modulo: "__plataforma__" },
  { href: "/admin/importacao-wordpress", label: "Importar do WordPress", modulo: "__importacao_wp__" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    return <>{children}</>;
  }

  let nomeImobiliaria = "Plataforma";
  let landingPagesHabilitado = true;
  let comissoesHabilitado = true;
  if (sessao.imobiliariaId) {
    try {
      const imob = await prisma.imobiliaria.findUnique({
        where: { id: sessao.imobiliariaId },
        select: { nome: true }
      });
      if (imob) nomeImobiliaria = imob.nome;

      const cfgs = await getConfigs(sessao.imobiliariaId, ["landingPagesHabilitado", "comissoesHabilitado"]);
      landingPagesHabilitado = cfgs["landingPagesHabilitado"] === "true";
      comissoesHabilitado    = cfgs["comissoesHabilitado"]    === "true";
    } catch {}
  }

  const permissoes = Array.isArray(sessao.permissoes) ? (sessao.permissoes as string[]) : [];

  function podeVerModulo(modulo: string | null): boolean {
    if (modulo === "__plataforma__") return sessao?.papel === "SUPER_ADMIN";
    if (modulo === "__importacao_wp__") return sessao?.papel === "SUPER_ADMIN" || sessao?.papel === "ADMIN";
    if (modulo === "landing_pages") return landingPagesHabilitado;
    if (modulo === "comissoes") return comissoesHabilitado;
    if (!modulo) return true; // null = visível a todos autenticados
    if (sessao?.papel === "SUPER_ADMIN") return true;
    if (sessao?.papel === "ADMIN") return true;
    if (modulo === "usuarios" || modulo === "auditoria" || modulo === "proprietarios") return false;
    return permissoes.includes(modulo);
  }

  const menu = TODOS_ITENS.flatMap((item) => {
    if (item.subItems && item.subItems.length > 0) {
      // Grupo com subitens: visível se ao menos 1 subitem é acessível
      const subsFiltrados = item.subItems.filter((sub) => podeVerModulo(sub.modulo));
      if (subsFiltrados.length === 0) return [];
      return [{ href: item.href, label: item.label, subItems: subsFiltrados }];
    }
    // Item plano: verifica o próprio módulo
    if (!podeVerModulo(item.modulo)) return [];
    return [{ href: item.href, label: item.label }];
  });

  const iniciais = (sessao.nome || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="h-screen flex bg-brand-light overflow-hidden">
      <AdminSidebar
        menu={menu}
        nomeImobiliaria={nomeImobiliaria}
        nomeUsuario={sessao.nome || "Administrador"}
      />

      <div className="flex-1 min-w-0 h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-14 bg-white border-b flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30">
          {/* Espaço para o botão hamburger no mobile (46px) */}
          <p className="text-sm text-gray-500 ml-12 lg:ml-0">Plataforma Imobiliária</p>
          <div className="flex items-center gap-2 lg:gap-3">
            <PwaInstallButton variant="admin" />
            <UserDropdown nome={sessao.nome || "Usuário"} iniciais={iniciais} />
          </div>
        </header>

        {/* Conteúdo */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
