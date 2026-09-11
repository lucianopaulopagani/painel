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

export interface Company {
  id: string;
  numero: string;
  name: string;
  /** CPF (11 dígitos) ou CNPJ (14 dígitos). */
  documento: string;
  inscricao_estadual: string | null;
  /** Unidade federativa (sigla de 2 letras). */
  uf: string;
  created_at: string;
}

/** Vínculo empresa × departamento, com os usuários responsáveis (opcional). */
export interface CompanyDepartmentLink {
  department_id: string;
  profile_ids: string[];
}

/** Empresa já com os departamentos vinculados. */
export interface CompanyWithDepartments extends Company {
  department_links: CompanyDepartmentLink[];
}

export interface Certificate {
  id: string;
  company_id: string;
  /** Data de vencimento (YYYY-MM-DD). */
  vencimento: string | null;
  avisado: boolean;
  agendamento_at: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

/** Linha do módulo "Certificado digital" (empresa + certificado, se houver). */
export interface CertificateRow {
  company: CompanyWithDepartments;
  certificate: Certificate | null;
}
