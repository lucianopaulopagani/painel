import type { Profile } from "@/lib/types";

/** Campos do cadastro de empresas liberáveis por usuário. */
export const EMPRESA_PERMISSION_FIELDS = [
  { key: "numero", label: "Nº" },
  { key: "name", label: "Nome" },
  { key: "documento", label: "CPF/CNPJ" },
  { key: "inscricao_estadual", label: "Inscrição Estadual" },
  { key: "uf", label: "UF" },
  { key: "municipio", label: "Município" },
  { key: "tributacao", label: "Tributação" },
  { key: "socio_responsavel", label: "Sócio responsável" },
  { key: "socio_cpf", label: "CPF do sócio" },
  { key: "data_inicio", label: "Data de Início" },
  { key: "departments", label: "Departamentos" },
  { key: "subdepartments", label: "Subdepartamentos" },
  { key: "responsaveis", label: "Responsáveis" },
] as const;

export type EmpresaPermissionKey =
  (typeof EMPRESA_PERMISSION_FIELDS)[number]["key"];

/**
 * Permissões de vínculo liberadas juntas pelo interruptor
 * "Subdepartamentos e responsáveis": só valem para os departamentos em que o
 * usuário participa.
 */
export const EMPRESA_LINK_PERMISSION_KEYS = [
  "subdepartments",
  "responsaveis",
] as const satisfies readonly EmpresaPermissionKey[];

/** Campos exibidos como caixinhas (os de vínculo ficam no interruptor). */
export const EMPRESA_FIELD_CHECKBOXES = EMPRESA_PERMISSION_FIELDS.filter(
  (field) =>
    !(EMPRESA_LINK_PERMISSION_KEYS as readonly string[]).includes(field.key)
);

/**
 * Campos efetivos do usuário: o vínculo (subdepartamentos + responsáveis) conta
 * como uma permissão só — quem já tinha "Responsáveis" mantém a liberação.
 */
export function effectiveEmpresaFields(
  profile: Profile | null | undefined
): string[] {
  const fields = profile?.empresas_fields ?? [];
  const hasLink = (EMPRESA_LINK_PERMISSION_KEYS as readonly string[]).some(
    (key) => fields.includes(key)
  );
  if (!hasLink) return fields;
  return Array.from(
    new Set([...fields, ...(EMPRESA_LINK_PERMISSION_KEYS as readonly string[])])
  );
}

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
    effectiveEmpresaFields(profile).includes(key)
  );
}
