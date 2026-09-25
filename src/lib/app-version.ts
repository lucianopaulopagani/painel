/**
 * Versão do sistema no formato: ORDEM.ANO.MÊS.CONTADOR
 *
 * - ORDEM: número de ordem — só muda quando solicitado.
 * - ANO (2 dígitos) e MÊS (2 dígitos): acompanham a data atual; mudam quando a
 *   primeira versão do novo ano/mês é lançada.
 * - CONTADOR: incrementa a cada versão lançada e reinicia em 01 quando sai a
 *   primeira versão do novo mês.
 */
const VERSION_STATE = {
  order: 1,
  /** Mês (YYYY-MM) em que o contador está valendo. */
  month: "2026-09",
  /** Contador atual (incrementar a cada versão lançada). */
  count: 43,
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getAppVersion(): string {
  const month = currentMonth();
  const count =
    VERSION_STATE.month === month ? VERSION_STATE.count : 1;
  const [year, monthPart] = month.split("-");
  return `${VERSION_STATE.order}.${year.slice(2)}.${monthPart}.${String(
    count
  ).padStart(2, "0")}`;
}

/** Versão atual exibida no menu do usuário. */
export const APP_VERSION = getAppVersion();
