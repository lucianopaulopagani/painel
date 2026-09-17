import type { Profile } from "@/lib/types";

/** Campos do cadastro de empresas liberáveis por usuário. */
export const EMPRESA_PERMISSION_FIELDS = [
  { key: "numero", label: "Nº" },
  { key: "name", label: "Nome" },
  { key: "documento", label: "CPF/CNPJ" },
  { key: "inscricao_estadual", label: "Inscrição Estadual" },
  { key: "uf", label: "UF" },
  { key: "tributacao", label: "Tributação" },
  { key: "socio_responsavel", label: "Sócio responsável" },
  { key: "socio_cpf", label: "CPF do sócio" },
  { key: "departments", label: "Departamentos" },
  { key: "responsaveis", label: "Responsáveis" },
] as const;

export type EmpresaPermissionKey =
  (typeof EMPRESA_PERMISSION_FIELDS)[number]["key"];

/** Administrador sempre acessa o cadastro de empresas. */
export function hasEmpresasAccess(
  profile: Profile | null | undefined
): boolean {
  return profile?.role === "admin" || profile?.empresas_access === true;
}

/** Verifica se o usuário pode alterar um campo específico da empresa. */
export function canEditEmpresaField(
  profile: Profile | null | undefined,
  key: EmpresaPermissionKey
): boolean {
  if (profile?.role === "admin") return true;
  return (
    profile?.empresas_access === true &&
    (profile.empresas_fields ?? []).includes(key)
  );
}
