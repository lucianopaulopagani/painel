/**
 * Dashboards por departamento — lista canônica usada no Dashboard geral e na
 * permissão por usuário (cadastro de usuários).
 *
 * As chaves são gravadas em `profiles.dashboard_departments`.
 */
export const DEPARTMENT_DASHBOARDS = [
  { key: "fiscal", label: "Fiscal" },
  { key: "pessoal", label: "Pessoal" },
  { key: "societario", label: "Societário" },
  { key: "contabil", label: "Contábil" },
  { key: "nota-fiscal", label: "Nota Fiscal" },
] as const;

export type DashboardKey = (typeof DEPARTMENT_DASHBOARDS)[number]["key"];

/** Mantém apenas chaves válidas e sem repetição (o registro fica limpo). */
export function sanitizeDashboardDepartments(values: unknown): DashboardKey[] {
  if (!Array.isArray(values)) return [];
  const valid = DEPARTMENT_DASHBOARDS.map((dashboard) => dashboard.key);
  return Array.from(
    new Set(
      values.filter((value): value is DashboardKey =>
        typeof value === "string" && (valid as string[]).includes(value)
      )
    )
  );
}
