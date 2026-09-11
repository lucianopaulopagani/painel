/** Opções da coluna SITUAÇÃO (vazio = Em branco). */
export const SITUACAO_OPTIONS = ["OK", "OK-ENT", "OK-SM"] as const;

/** Opções dos campos que são menu suspenso (vazio = sem marcação). */
export const DAS_OPTIONS = ["OK", "OK-SM"] as const;
export const ENVIO_OPTIONS = ["OK", "OK-SM"] as const;

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
  { key: "das", label: "DAS", type: "select", options: DAS_OPTIONS },
  { key: "antecipacao", label: "ANTECIPAÇÃO", type: "input" },
  { key: "st", label: "ST", type: "input" },
  { key: "dif_aliq", label: "DIF ALIQ", type: "input" },
  { key: "dif_aliq_st", label: "DIF ALIQ C/ST", type: "input" },
  { key: "guia", label: "GUIA", type: "checkbox" },
  { key: "destda", label: "DESTDA", type: "checkbox" },
  {
    key: "envio_sn",
    label: "ENVIO/SN",
    type: "select",
    options: ENVIO_OPTIONS,
  },
  {
    key: "envio_icms",
    label: "ENVIO/ICMS",
    type: "select",
    options: ENVIO_OPTIONS,
  },
];
