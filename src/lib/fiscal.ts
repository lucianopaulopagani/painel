/** Opções da coluna SITUAÇÃO (vazio = Em branco). */
export const SITUACAO_OPTIONS = ["OK", "OK-ENT", "OK-SM"] as const;

/** Opções dos campos de menu suspenso (vazio = sem marcação). */
export const OK_SM_OPTIONS = ["OK", "OK-SM"] as const;

export type MovimentoFiscalFieldKey =
  | "das"
  | "antecipacao"
  | "st"
  | "dif_aliq"
  | "dif_aliq_st"
  | "guia"
  | "destda"
  | "envio_sn"
  | "envio_icms";

export interface MovimentoFiscalFieldDef {
  key: MovimentoFiscalFieldKey;
  label: string;
  /** checkbox = marcação; select = menu suspenso; input = digitação de valor. */
  type: "checkbox" | "select" | "input";
  options?: readonly string[];
}

/** Campos de obrigação do Movimento Fiscal. */
export const MOVIMENTO_FISCAL_FIELDS: MovimentoFiscalFieldDef[] = [
  { key: "das", label: "DAS", type: "select", options: OK_SM_OPTIONS },
  { key: "antecipacao", label: "ANTECIPAÇÃO", type: "input" },
  { key: "st", label: "ST", type: "input" },
  { key: "dif_aliq", label: "DIF ALIQ", type: "input" },
  { key: "dif_aliq_st", label: "DIF ALIQ C/ST", type: "input" },
  { key: "guia", label: "GUIA", type: "select", options: OK_SM_OPTIONS },
  { key: "destda", label: "DESTDA", type: "select", options: OK_SM_OPTIONS },
  {
    key: "envio_sn",
    label: "ENVIO/SN",
    type: "select",
    options: OK_SM_OPTIONS,
  },
  {
    key: "envio_icms",
    label: "ENVIO/ICMS",
    type: "select",
    options: OK_SM_OPTIONS,
  },
];
