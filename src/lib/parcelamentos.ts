/**
 * Controle de Parcelamentos — submenu do departamento Fiscal.
 *
 * N, UF, Empresa e CNPJ vêm do cadastro de empresas. As colunas de parcelamento
 * (SIMPLES até MUNICIPAL) são listas suspensas com GERADO e DESABILITADO — a
 * opção Desabilitado é pintada com a cor de destaque e segue para os próximos
 * meses até ser alterada. ENVIO tem GERADO e ENVIADO e alimenta o dashboard:
 * ENVIADO conta como finalizada; GERADO e em branco como pendentes.
 */

export type ParcelamentoFieldKey =
  | "simples"
  | "mei_relp_iss"
  | "estadual"
  | "inss_rfb"
  | "inss_pgfn"
  | "sn_pgfn"
  | "pert"
  | "sn_relp"
  | "relp_pgfn"
  | "municipal";

export interface ParcelamentoFieldDef {
  key: ParcelamentoFieldKey;
  label: string;
}

/** Colunas de parcelamento (na ordem da planilha modelo). */
export const PARCELAMENTO_FIELDS: ParcelamentoFieldDef[] = [
  { key: "simples", label: "SIMPLES" },
  { key: "mei_relp_iss", label: "MEI/RELP/ISS" },
  { key: "estadual", label: "ESTADUAL" },
  { key: "inss_rfb", label: "INSS RFB" },
  { key: "inss_pgfn", label: "INSS PGFN" },
  { key: "sn_pgfn", label: "SN PGFN" },
  { key: "pert", label: "PERT" },
  { key: "sn_relp", label: "SN RELP" },
  { key: "relp_pgfn", label: "RELP PGFN" },
  { key: "municipal", label: "MUNICIPAL" },
];

export const PARCELAMENTO_GERADO = "GERADO";
export const PARCELAMENTO_DESABILITADO = "DESABILITADO";

/** Opções das colunas de parcelamento. */
export const PARCELAMENTO_OPTIONS = [
  PARCELAMENTO_GERADO,
  PARCELAMENTO_DESABILITADO,
] as const;

/** Cores das colunas de parcelamento (Desabilitado com a cor de destaque). */
export const PARCELAMENTO_TONE: Record<string, string> = {
  [PARCELAMENTO_GERADO]:
    "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
  [PARCELAMENTO_DESABILITADO]:
    "bg-status-disabled font-semibold text-status-disabled-foreground ring-1 ring-inset ring-white/40 hover:bg-status-disabled/90",
};

/** Opções da coluna ENVIO. */
export const PARCELAMENTO_ENVIO_OPTIONS = ["GERADO", "ENVIADO"] as const;

export const PARCELAMENTO_ENVIO_GERADO = "GERADO";
export const PARCELAMENTO_ENVIO_ENVIADO = "ENVIADO";

/** Cores da coluna ENVIO: ENVIADO finalizada (verde), GERADO pendente (âmbar). */
export const PARCELAMENTO_ENVIO_TONE: Record<string, string> = {
  [PARCELAMENTO_ENVIO_GERADO]:
    "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
  [PARCELAMENTO_ENVIO_ENVIADO]:
    "bg-status-success text-status-success-foreground hover:bg-status-success/90",
};

/** Indica o valor "Desabilitado" (segue para os próximos meses até ser alterado). */
export function isParcelamentoDesabilitado(
  value: string | null | undefined
): boolean {
  return value === PARCELAMENTO_DESABILITADO;
}

/** ENVIADO conta como finalizada; GERADO e em branco como pendentes. */
export function isEnvioFinalizado(
  value: string | null | undefined
): boolean {
  return value === PARCELAMENTO_ENVIO_ENVIADO;
}

/** Rótulo do ENVIO em branco (usado nos filtros e no dashboard). */
export const PARCELAMENTO_ENVIO_BRANCO = "Em branco";
