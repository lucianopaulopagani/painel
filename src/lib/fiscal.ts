export const SITUACAO_OPTIONS = ["Em dia", "Pendente", "Não informado"] as const;

/** Campos de obrigação do Movimento Fiscal (marcação Sim/Não por enquanto). */
export const MOVIMENTO_FISCAL_FIELDS = [
  { key: "das", label: "DAS" },
  { key: "antecipacao", label: "ANTECIPAÇÃO" },
  { key: "st", label: "ST" },
  { key: "dif_aliq", label: "DIF ALIQ" },
  { key: "dif_aliq_st", label: "DIF ALIQ C/ST" },
  { key: "guia", label: "GUIA" },
  { key: "destda", label: "DESTDA" },
  { key: "envio_sn", label: "ENVIO/SN" },
  { key: "envio_icms", label: "ENVIO/ICMS" },
] as const;

export type MovimentoFiscalFieldKey =
  (typeof MOVIMENTO_FISCAL_FIELDS)[number]["key"];
