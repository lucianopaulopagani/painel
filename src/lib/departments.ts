import type { Department } from "@/lib/types";

/** Departamento que dá acesso ao painel do Societário. */
export const SOCIETARIO_DEPARTMENT_NAME = "Societário";

export function findDepartmentByName(
  departments: Department[] | undefined,
  name: string
): Department | undefined {
  return (departments ?? []).find((department) => department.name === name);
}
