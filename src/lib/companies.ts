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
