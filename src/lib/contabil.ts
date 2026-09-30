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

/** Opções das células mensais (OK, LANÇADO ou em branco). */
export const BALANCETE_MES_OPTIONS = ["OK", "LANÇADO"] as const;

/** Opções da coluna Fechamento. */
export const BALANCETE_FECHAMENTO_OPTIONS = ["LANÇADO", "ENCERRADA"] as const;

/** Anos disponíveis no filtro por ano (ano corrente ± 3). */
export function balanceteAnos(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) =>
    String(current - 3 + index)
  );
}

/** Chave do ano selecionado no Contábil (compartilhada entre tela e dashboard). */
export const BALANCETE_ANO_STORAGE_KEY = "contabil:balancete-ano";

/** Ano selecionado pelo usuário (ano corrente quando não houver). */
export function readStoredBalanceteAno(): string {
  try {
    return (
      localStorage.getItem(BALANCETE_ANO_STORAGE_KEY) ??
      String(new Date().getFullYear())
    );
  } catch {
    return String(new Date().getFullYear());
  }
}

/** Guarda o ano selecionado (ignora armazenamento indisponível). */
export function writeStoredBalanceteAno(ano: string): void {
  try {
    localStorage.setItem(BALANCETE_ANO_STORAGE_KEY, ano);
  } catch {
    // ignora armazenamento indisponível
  }
}
