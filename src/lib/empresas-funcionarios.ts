/** Opções do submenu Empresas com Funcionários (folha mensal). */
export const EMPRESAS_FUNC_STATUS_OPTIONS = [
  "Concluído",
  "Pendente",
  "Em Andamento",
  "Em Ajuste",
  "Desativado",
] as const;

/** Opções comuns das colunas de marcação (Empréstimo, FGTS, Taxa, DCTFWEB). */
export const EMPRESAS_FUNC_FLAG_OPTIONS = [
  "OK",
  "Não Possui",
  "Possui",
  "SEM",
  "Oposição",
] as const;

/** Opções do campo Empréstimo (herdado para os próximos meses). */
export const EMPRESAS_FUNC_EMPRESTIMO_OPTIONS = [
  "OK",
  "Não Possui",
  "Possui",
] as const;

/** Opções do campo FGTS. */
export const EMPRESAS_FUNC_FGTS_OPTIONS = [
  "OK",
  "Não Possui",
  "Possui",
] as const;

/** Opções do campo DCTFWEB. */
export const EMPRESAS_FUNC_DCTFWEB_OPTIONS = [
  "OK",
  "Não Possui",
  "Possui",
] as const;

export const EMPRESAS_FUNC_ENVIO_OPTIONS = ["Enviado", "Pendente"] as const;

/** Meses do ano em 3 letras maiúsculas (Data Base). */
export const EMPRESAS_FUNC_MESES_OPTIONS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

/** Opções do campo Folha (apenas o mês atual). */
export const EMPRESAS_FUNC_FOLHA_OPTIONS = ["OK - GABI"] as const;
