// Catálogo de módulos do painel e regras de permissão por usuário.
// Cada usuário guarda um array de chaves (campo `permissoes`, JSON) com os
// módulos que pode acessar. Quando esse campo está vazio/nulo, usamos o
// padrão definido por papel em `permissoesPadrao`.

export const MODULOS = [
  { chave: "imoveis", label: "Imóveis" },
  { chave: "leads", label: "Leads" },
  { chave: "corretores", label: "Corretores" },
  { chave: "captacoes", label: "Captação de Imóveis" },
  { chave: "proprietarios", label: "Proprietários" },
  { chave: "banners", label: "Banners" },
  { chave: "configuracoes", label: "Configurações" },
  { chave: "usuarios", label: "Usuários" }
] as const;

export type ModuloChave = typeof MODULOS[number]["chave"];

export function permissoesPadrao(papel: string): ModuloChave[] {
  if (papel === "SUPER_ADMIN" || papel === "ADMIN") {
    return MODULOS.map((m) => m.chave);
  }
  // CORRETOR: acesso restrito por padrão, ampliável pelo administrador.
  return ["leads"];
}

export function temPermissao(
  sessao: { papel: string; permissoes?: string[] | null } | null | undefined,
  modulo: ModuloChave
): boolean {
  if (!sessao) return false;
  if (sessao.papel === "SUPER_ADMIN") return true;
  const permissoes = Array.isArray(sessao.permissoes) ? sessao.permissoes : permissoesPadrao(sessao.papel);
  return permissoes.includes(modulo);
}
