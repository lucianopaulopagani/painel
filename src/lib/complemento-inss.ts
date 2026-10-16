/** Opções do submenu Complemento INSS (folha mensal). */
export const COMPLEMENTO_INSS_DARF_OPTIONS = [
  "OK",
  "Possui",
  "Não Possui",
] as const;

export const COMPLEMENTO_INSS_ENVIO_OPTIONS = ["Enviado", "Pendente"] as const;

/**
 * Valor legado da coluna Envio: não é mais oferecido no Complemento INSS, mas
 * continua exibido nos meses já gravados para preservar o histórico.
 */
export const COMPLEMENTO_INSS_ENVIO_DESATIVADO = "Desativado";
