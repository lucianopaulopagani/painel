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

export function findDepartmentByName(
  departments: Department[] | undefined,
  name: string
): Department | undefined {
  return (departments ?? []).find((department) => department.name === name);
}
