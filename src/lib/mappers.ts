import type {
  CompanyWithDepartments,
  DepartmentRef,
  ProfileWithDepartments,
  Role,
  SubdepartmentPeriod,
} from "@/lib/types";

/** Linha crua de "profiles" com os vínculos aninhados do PostgREST. */
export interface RawProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  dashboard_access: boolean;
  empresas_access: boolean;
  empresas_fields: string[];
  empresas_criar: boolean;
  empresas_importar: boolean;
  empresas_bulk: boolean;
  chat_access: boolean;
  tarefas_access: boolean;
  agenda_access: boolean;
  chat_admin: boolean;
  avatar_url: string | null;
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
    dashboard_access: row.dashboard_access,
    empresas_access: row.empresas_access,
    empresas_fields: row.empresas_fields,
    empresas_criar: row.empresas_criar,
    empresas_importar: row.empresas_importar,
    empresas_bulk: row.empresas_bulk,
    chat_access: row.chat_access ?? false,
    tarefas_access: row.tarefas_access ?? false,
    agenda_access: row.agenda_access ?? false,
    chat_admin: row.chat_admin ?? false,
    avatar_url: row.avatar_url ?? null,
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
  tipo?: string | null;
  name: string;
  documento: string;
  inscricao_estadual: string | null;
  uf: string;
  tributacao: string | null;
  municipio: string | null;
  socio_responsavel: string | null;
  socio_cpf: string | null;
  ativa: boolean;
  motivo_inativacao: string | null;
  data_inativacao: string | null;
  data_inicio: string | null;
  created_at: string;
  company_departments?:
    | {
        department_id: string;
        responsible_profile_ids: string[] | null;
        subdepartments: string[] | null;
        subdepartment_responsibles: Record<string, string[]> | null;
        subdepartment_periods: Record<string, unknown> | null;
      }[]
    | null;
}

/** Normaliza o jsonb de responsáveis por subdepartamento. */
export function toSubdepartmentResponsibles(
  value: Record<string, string[]> | null | undefined
): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value)
    .map(
      ([submenu, ids]) =>
        [submenu, Array.isArray(ids) ? ids.filter(Boolean) : []] as const
    )
    .filter(([, ids]) => ids.length > 0);
  return Object.fromEntries(entries);
}

/** Normaliza o jsonb de períodos por subdepartamento. */
export function toSubdepartmentPeriods(
  value: Record<string, unknown> | null | undefined
): Record<string, SubdepartmentPeriod> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value)
    .map(([submenu, period]) => {
      const raw = (period ?? {}) as { inicio?: unknown; fim?: unknown };
      return [
        submenu,
        {
          inicio: typeof raw.inicio === "string" && raw.inicio ? raw.inicio : null,
          fim: typeof raw.fim === "string" && raw.fim ? raw.fim : null,
        },
      ] as const;
    })
    .filter(([, period]) => period.inicio !== null || period.fim !== null);
  return Object.fromEntries(entries);
}

/** Converte o retorno aninhado em `department_links`. */
export function toCompanyWithDepartments(
  row: RawCompanyRow
): CompanyWithDepartments {
  return {
    id: row.id,
    numero: row.numero,
    tipo: row.tipo ?? "matriz",
    name: row.name,
    documento: row.documento,
    inscricao_estadual: row.inscricao_estadual,
    uf: row.uf,
    tributacao: row.tributacao ?? null,
    municipio: row.municipio ?? null,
    socio_responsavel: row.socio_responsavel ?? null,
    socio_cpf: row.socio_cpf ?? null,
    ativa: row.ativa ?? true,
    motivo_inativacao: row.motivo_inativacao ?? null,
    data_inativacao: row.data_inativacao ?? null,
    data_inicio: row.data_inicio ?? null,
    created_at: row.created_at,
    department_links: (row.company_departments ?? []).map((link) => ({
      department_id: link.department_id,
      profile_ids: link.responsible_profile_ids ?? [],
      subdepartments: link.subdepartments ?? [],
      subdepartment_responsibles: toSubdepartmentResponsibles(
        link.subdepartment_responsibles
      ),
      subdepartment_periods: toSubdepartmentPeriods(link.subdepartment_periods),
    })),
  };
}
