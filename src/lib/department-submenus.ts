import type { CompanyWithDepartments } from "@/lib/types";

/**
 * Subdepartamentos (submenus) de cada departamento, usados no cadastro de
 * empresas para marcar quais áreas a empresa utiliza.
 *
 * Mantenha esta lista em sincronia com os módulos do painel (DepartmentPanel):
 * sempre que um novo submenu for criado, atualize aqui (sem Dashboard e Manual).
 */
export const DEPARTMENT_SUBMENUS: Record<string, string[]> = {
  "Depart. Fiscal": ["Movimento Fiscal"],
  "Depart. Pessoal": [
    "Empresas com funcionários",
    "Empresas Fiscal",
    "Domésticas",
    "Ponto",
    "Complemento INSS",
  ],
  Societário: ["Certificado digital"],
  "Depart. Contábil": ["Balancete/Balanço"],
  "Nota Fiscal": [],
};

/** Subdepartamentos de um departamento (vazios quando não houver). */
export function submenusOf(departmentName: string): string[] {
  return DEPARTMENT_SUBMENUS[departmentName] ?? [];
}

/**
 * Indica se a empresa utiliza o subdepartamento (submenu) informado no
 * departamento — as listas só mostram empresas com o subdepartamento marcado.
 */
export function companyUsesSubmenu(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string
): boolean {
  if (!departmentId) return false;
  const link = company.department_links.find(
    (item) => item.department_id === departmentId
  );
  return Boolean(link && (link.subdepartments ?? []).includes(submenuLabel));
}
