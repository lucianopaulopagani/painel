export type Role = "admin" | "member";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

/** Perfil já com a lista de departamentos vinculados (N:N). */
export interface ProfileWithDepartments extends Profile {
  departments: DepartmentRef[];
}

export interface ManageUserPayload {
  action:
    | "create-user"
    | "update-user"
    | "reset-password"
    | "delete-user";
  [key: string]: unknown;
}
