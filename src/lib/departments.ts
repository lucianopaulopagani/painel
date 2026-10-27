import type { Department } from "@/lib/types";

/** Departamento que dá acesso ao painel do Societário. */
export const SOCIETARIO_DEPARTMENT_NAME = "Societário";

/** Departamento que dá acesso ao painel do Fiscal. */
export const FISCAL_DEPARTMENT_NAME = "Depart. Fiscal";

/** Departamento que dá acesso ao painel do Pessoal. */
export const PESSOAL_DEPARTMENT_NAME = "Depart. Pessoal";

/** Departamento que dá acesso ao painel do Contábil. */
export const CONTABIL_DEPARTMENT_NAME = "Depart. Contábil";

/** Departamento que dá acesso ao painel de Nota Fiscal. */
export const NOTA_FISCAL_DEPARTMENT_NAME = "Nota Fiscal";

/** Ordem de exibição dos departamentos nos menus. */
const DEPARTMENT_ORDER = [
  FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  CONTABIL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
];

/** Departamentos na ordem dos menus (os demais em ordem alfabética, no fim). */
export function sortDepartments(names: string[]): string[] {
  const rank = (name: string) => {
    const index = DEPARTMENT_ORDER.indexOf(name);
    return index === -1 ? DEPARTMENT_ORDER.length : index;
  };
  return [...names].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b, "pt-BR")
  );
}

/** Nomes exibidos nos submenus de "Cadastro de Tabelas". */
const DEPARTMENT_MENU_LABELS: Record<string, string> = {
  [FISCAL_DEPARTMENT_NAME]: "Departamento Fiscal",
  [PESSOAL_DEPARTMENT_NAME]: "Departamento Pessoal",
  [CONTABIL_DEPARTMENT_NAME]: "Departamento Contábil",
  [SOCIETARIO_DEPARTMENT_NAME]: "Departamento Societário",
  [NOTA_FISCAL_DEPARTMENT_NAME]: "Departamento Nota Fiscal",
};

/** Nome amigável do departamento nos menus (mantém o nome original se não houver). */
export function departmentMenuLabel(name: string): string {
  return DEPARTMENT_MENU_LABELS[name] ?? name;
}

export function findDepartmentByName(
  departments: Department[] | undefined,
  name: string
): Department | undefined {
  return (departments ?? []).find((department) => department.name === name);
}
