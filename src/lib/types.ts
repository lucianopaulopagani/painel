export type Role = "admin" | "member";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  created_at: string;
}

export interface ProfileWithDepartment extends Profile {
  departments: { id: string; name: string } | null;
}

export interface ManageUserPayload {
  action:
    | "create-user"
    | "update-user"
    | "reset-password"
    | "delete-user";
  [key: string]: unknown;
}
