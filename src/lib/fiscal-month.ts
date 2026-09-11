export const FISCAL_MONTH_STORAGE_KEY = "fiscal:mes-referencia";

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(mes: string, amount: number): string {
  const [year, month] = mes.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split("-");
  return `${month}/${year}`;
}

export function readStoredMonth(): string {
  try {
    return localStorage.getItem(FISCAL_MONTH_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeStoredMonth(value: string): void {
  try {
    localStorage.setItem(FISCAL_MONTH_STORAGE_KEY, value);
  } catch {
    // armazenamento indisponível — mantém apenas em memória
  }
}

/** Mês de referência de trabalho: o anterior ao mês em curso. */
export function defaultReferenceMonth(): string {
  return addMonths(currentMonth(), -1);
}
