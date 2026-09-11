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
  /** Rótulo abreviado usado no cabeçalho da tabela. */
  short: string;
  /** checkbox = marcação; select = menu suspenso; input = digitação de valor. */
  type: "checkbox" | "select" | "input";
  options?: readonly string[];
}

/** Campos de obrigação do Movimento Fiscal. */
export const MOVIMENTO_FISCAL_FIELDS: MovimentoFiscalFieldDef[] = [
  { key: "das", label: "DAS", short: "das", type: "select", options: OK_SM_OPTIONS },
  { key: "antecipacao", label: "ANTECIPAÇÃO", short: "antecip.", type: "input" },
  { key: "st", label: "ST", short: "st", type: "input" },
  { key: "dif_aliq", label: "DIF ALIQ", short: "dif aliq", type: "input" },
  {
    key: "dif_aliq_st",
    label: "DIF ALIQ C/ST",
    short: "dif a/st",
    type: "input",
  },
  { key: "guia", label: "GUIA", short: "guia", type: "select", options: OK_SM_OPTIONS },
  { key: "destda", label: "DESTDA", short: "destda", type: "select", options: OK_SM_OPTIONS },
  {
    key: "envio_sn",
    label: "ENVIO/SN",
    short: "env/sn",
    type: "select",
    options: OK_SM_OPTIONS,
  },
  {
    key: "envio_icms",
    label: "ENVIO/ICMS",
    short: "env/icms",
    type: "select",
    options: OK_SM_OPTIONS,
  },
];
