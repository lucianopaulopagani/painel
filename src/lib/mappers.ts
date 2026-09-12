import type {
  CompanyWithDepartments,
  DepartmentRef,
  ProfileWithDepartments,
  Role,
} from "@/lib/types";

/** Linha crua de "profiles" com os vínculos aninhados do PostgREST. */
export interface RawProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
  profile_departments?: { departments: DepartmentRef | null }[] | null;
}

/** Converte o retorno aninhado em `departments: DepartmentRef[]`. */
export function toProfileWithDepartments(
  row: RawProfileRow
): ProfileWithDepartments {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    created_at: row.created_at,
    departments: (row.profile_departments ?? [])
      .map((link) => link.departments)
      .filter((department): department is DepartmentRef => department !== null),
  };
}

/** Linha crua de "companies" com os vínculos de departamento. */
export interface RawCompanyRow {
  id: string;
  numero: string | null;
  name: string;
  documento: string;
  inscricao_estadual: string | null;
  uf: string;
  tributacao: string | null;
  created_at: string;
  company_departments?:
    | { department_id: string; responsible_profile_ids: string[] | null }[]
    | null;
}

/** Converte o retorno aninhado em `department_links`. */
export function toCompanyWithDepartments(
  row: RawCompanyRow
): CompanyWithDepartments {
  return {
    id: row.id,
    numero: row.numero,
    name: row.name,
    documento: row.documento,
    inscricao_estadual: row.inscricao_estadual,
    uf: row.uf,
    tributacao: row.tributacao ?? null,
    created_at: row.created_at,
    department_links: (row.company_departments ?? []).map((link) => ({
      department_id: link.department_id,
      profile_ids: link.responsible_profile_ids ?? [],
    })),
  };
}
