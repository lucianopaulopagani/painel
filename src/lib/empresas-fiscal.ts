/** Opções do submenu Empresas Fiscal (folha mensal). */
export const EMPRESAS_FISCAL_STATUS_OPTIONS = [
  "Concluído",
  "Pendente",
  "Em Andamento",
  "Em Ajuste",
] as const;

export const EMPRESAS_FISCAL_DCTFWEB_OPTIONS = ["OK"] as const;

/**
 * Opções de Envio do submenu Empresas Fiscal. O valor antigo "Desativado" fica
 * apenas no histórico (a tela não o oferece na lista).
 */
export const EMPRESAS_FISCAL_ENVIO_OPTIONS = [
  "Enviado",
  "Pendente",
  "Desativado",
] as const;
