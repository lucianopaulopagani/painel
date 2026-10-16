import { isCompanyInactiveInMonth } from "@/lib/companies";
import type { CompanyWithDepartments, SubdepartmentPeriod } from "@/lib/types";

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

/** Texto exibido nos campos bloqueados por estarem fora do período. */
export const SUBDEPARTMENT_PERIOD_BLOCK_TITLE =
  "Fora do período do subdepartamento no cadastro da empresa — edição bloqueada.";

/** Vínculo empresa × departamento (ou undefined quando não existe). */
function departmentLink(
  company: CompanyWithDepartments,
  departmentId: string | undefined
) {
  if (!departmentId) return undefined;
  return company.department_links.find(
    (item) => item.department_id === departmentId
  );
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
  return Boolean(
    departmentLink(company, departmentId)?.subdepartments?.includes(submenuLabel)
  );
}

/**
 * Usuários responsáveis por um subdepartamento do vínculo empresa × departamento.
 * Cada módulo usa os responsáveis do seu próprio subdepartamento.
 */
export function subdepartmentResponsibleIds(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string
): string[] {
  return (
    departmentLink(company, departmentId)?.subdepartment_responsibles?.[
      submenuLabel
    ] ?? []
  );
}

/**
 * Período (mês de início e mês final) do subdepartamento no vínculo da empresa.
 * Campos nulos significam "sem limite".
 */
export function subdepartmentPeriod(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string
): SubdepartmentPeriod {
  const period =
    departmentLink(company, departmentId)?.subdepartment_periods?.[submenuLabel];
  return { inicio: period?.inicio ?? null, fim: period?.fim ?? null };
}

/** O período do subdepartamento cruza a janela [from, to] (meses YYYY-MM)? */
function periodOverlaps(
  period: SubdepartmentPeriod,
  from: string,
  to: string
): boolean {
  if (period.inicio && period.inicio > to) return false;
  if (period.fim && period.fim < from) return false;
  return true;
}

/**
 * O subdepartamento está dentro do período no mês informado (YYYY-MM)?
 * Antes do mês de início a empresa não aparece; depois do mês final ela sai
 * das tabelas (os meses lançados antes continuam no histórico).
 */
export function isCompanyInSubmenuInMonth(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string,
  mes: string
): boolean {
  return periodOverlaps(
    subdepartmentPeriod(company, departmentId, submenuLabel),
    mes,
    mes
  );
}

/** O subdepartamento está dentro do período em algum mês do ano informado? */
export function isCompanyInSubmenuInYear(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string,
  ano: string
): boolean {
  const year = ano.slice(0, 4);
  return periodOverlaps(
    subdepartmentPeriod(company, departmentId, submenuLabel),
    `${year}-01`,
    `${year}-12`
  );
}

/**
 * A empresa aparece no módulo mensal do subdepartamento? Considera o
 * subdepartamento marcado, o período e a inativação da empresa.
 */
export function companyInSubmenuInMonth(
  company: CompanyWithDepartments,
  departmentId: string | undefined,
  submenuLabel: string,
  mes: string
): boolean {
  return (
    companyUsesSubmenu(company, departmentId, submenuLabel) &&
    isCompanyInSubmenuInMonth(company, departmentId, submenuLabel, mes) &&
    !isCompanyInactiveInMonth(company, mes)
  );
}
