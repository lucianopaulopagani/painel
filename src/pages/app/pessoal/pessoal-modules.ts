/** Submenus da Folha de Pagamento Mensal (Pessoal) — novos submenus entram aqui. */
export const PESSOAL_SUB_MENUS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "empresas-funcionarios", label: "Empresas com funcionários" },
  { key: "empresas-fiscal", label: "Empresas Fiscal" },
  { key: "domesticas", label: "Domésticas" },
  { key: "ponto", label: "Ponto" },
  { key: "complemento-inss", label: "Complemento INSS" },
] as const;

export type PessoalSubMenuKey = (typeof PESSOAL_SUB_MENUS)[number]["key"];
