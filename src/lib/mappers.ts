import type {
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
