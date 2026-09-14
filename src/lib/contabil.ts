/** Meses do Balancete/Balanço (colunas JAN..DEZ do ano). */
export const BALANCETE_MESES = [
  { key: "jan", label: "JAN" },
  { key: "fev", label: "FEV" },
  { key: "mar", label: "MAR" },
  { key: "abr", label: "ABR" },
  { key: "mai", label: "MAI" },
  { key: "jun", label: "JUN" },
  { key: "jul", label: "JUL" },
  { key: "ago", label: "AGO" },
  { key: "set", label: "SET" },
  { key: "out", label: "OUT" },
  { key: "nov", label: "NOV" },
  { key: "dez", label: "DEZ" },
] as const;

/** Opções das células mensais (OK ou em branco). */
export const BALANCETE_MES_OPTIONS = ["OK"] as const;

/** Anos disponíveis no filtro por ano (ano corrente ± 3). */
export function balanceteAnos(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) =>
    String(current - 3 + index)
  );
}
