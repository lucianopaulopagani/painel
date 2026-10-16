/** Opções do submenu Domésticas (folha mensal por empresa). */
export const DOMESTICAS_STATUS_OPTIONS = [
  "Concluído",
  "Pendente",
  "Em Andamento",
  "Em Ajuste",
  "Sem Movimento",
] as const;

/** Status que tira a empresa da lista principal (tabela "Sem movimento"). */
export const DOMESTICAS_SEM_MOVIMENTO = "Sem Movimento";

/** Meses da Data Base por extenso (conforme a planilha modelo). */
export const DOMESTICAS_MESES_OPTIONS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const DOMESTICAS_FOLHA_OPTIONS = ["OK", "Possui", "Não Possui"] as const;

export const DOMESTICAS_DAE_OPTIONS = ["OK", "Possui", "Não Possui"] as const;

export const DOMESTICAS_ENVIO_OPTIONS = ["Enviado", "Pendente"] as const;

export const DOMESTICAS_PONTO_OPTIONS = ["Enviado", "Pendente"] as const;
