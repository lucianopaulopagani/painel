/** Opções de regime de tributação do cadastro de empresas. */
export const TRIBUTACOES = [
  "Simples Nacional",
  "Lucro Real",
  "Lucro Presumido",
  "MEI",
  "Pessoa Física",
  "Carne Leão",
  "Empregada Doméstica",
] as const;

/** Motivos de inativação da empresa. */
export const MOTIVOS_INATIVACAO = [
  "Encerramento de atividades",
  "Mudou de contabilidade",
  "Inadimplência",
  "Solicitação do cliente",
  "Empresa sem movimento",
  "Outro",
] as const;

/**
 * Empresa considerada inativa em um mês de referência (YYYY-MM).
 *
 * A data de inativação é o último dia ativo (ex.: 30/09/2026); a empresa é
 * desabilitada a partir do mês seguinte (ex.: 10/2026). Meses anteriores
 * permanecem sem alteração.
 */
export function isCompanyInactiveInMonth(
  company: { ativa: boolean; data_inativacao: string | null },
  mes: string
): boolean {
  if (company.ativa) return false;
  if (!company.data_inativacao) return false;
  const mesInativacao = company.data_inativacao.slice(0, 7);
  return mes > mesInativacao;
}

/** Empresa inativa em relação à data de hoje (para telas sem mês). */
export function isCompanyInactiveToday(company: {
  ativa: boolean;
  data_inativacao: string | null;
}): boolean {
  if (company.ativa) return false;
  if (!company.data_inativacao) return false;
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return mesAtual > company.data_inativacao.slice(0, 7);
}

/** Texto exibido nos campos bloqueados pela Data de Início. */
export const DATA_INICIO_BLOCK_TITLE =
  "Período anterior à Data de Início da empresa — edição bloqueada.";

/**
 * Período anterior à Data de Início da empresa.
 *
 * A Data de Início vale para todos os departamentos e subdepartamentos: meses
 * anteriores ao mês da data ficam bloqueados para edição/inserção (o mês da
 * própria data já é editável). Ex.: Data de Início 15/03/2026 bloqueia até
 * 02/2026.
 */
export function isPeriodBeforeStart(
  company: { data_inicio: string | null },
  period: string | null | undefined
): boolean {
  if (!company.data_inicio || !period) return false;
  return period.slice(0, 7) < company.data_inicio.slice(0, 7);
}

/** Ano anterior ao ano da Data de Início. */
export function isYearBeforeStart(
  company: { data_inicio: string | null },
  ano: string | null | undefined
): boolean {
  if (!company.data_inicio || !ano) return false;
  return ano.slice(0, 4) < company.data_inicio.slice(0, 4);
}

/** Data (YYYY-MM-DD) anterior à Data de Início da empresa. */
export function isDateBeforeStart(
  company: { data_inicio: string | null },
  date: string | null | undefined
): boolean {
  if (!company.data_inicio || !date) return false;
  return date < company.data_inicio;
}
