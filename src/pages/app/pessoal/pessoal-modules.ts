/** Submenus do Movimento Fiscal (Pessoal) — novos submenus entram aqui. */
export const PESSOAL_SUB_MENUS = [
  { key: "empresas-funcionarios", label: "Empresas com funcionários" },
] as const;

export type PessoalSubMenuKey = (typeof PESSOAL_SUB_MENUS)[number]["key"];
