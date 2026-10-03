/**
 * Tabela de Lucro Real / Lucro Presumido do Movimento Fiscal.
 *
 * Mesmo modelo de colunas para as duas tributações: N, EMPRESA, UF (do
 * cadastro de empresas) e as obrigações ISSQN, DIME/GIA PR, DAPI, GIA RS,
 * DRCST, SPED FISCAL, SPED CONTR, REINF, DIRBI, MIT e OBS.
 */

export const LUCRO_REAL_TRIBUTACAO = "Lucro Real";
export const LUCRO_PRESUMIDO_TRIBUTACAO = "Lucro Presumido";

/** Tributações atendidas por esta tabela. */
export const LUCRO_TRIBUTACOES = [
  LUCRO_REAL_TRIBUTACAO,
  LUCRO_PRESUMIDO_TRIBUTACAO,
] as const;

export function isLucroTributacao(tributacao: string): boolean {
  return (LUCRO_TRIBUTACOES as readonly string[]).includes(tributacao);
}

export type LucroFieldKey =
  | "issqn"
  | "dime_gia_pr"
  | "dapi"
  | "gia_rs"
  | "drcst"
  | "sped_fiscal"
  | "sped_contr"
  | "reinf"
  | "dirbi"
  | "mit";

export interface LucroFieldDef {
  key: LucroFieldKey;
  label: string;
}

/** Colunas de obrigação da tabela (na ordem do modelo). */
export const LUCRO_FIELDS: LucroFieldDef[] = [
  { key: "issqn", label: "ISSQN" },
  { key: "dime_gia_pr", label: "DIME/GIA PR" },
  { key: "dapi", label: "DAPI" },
  { key: "gia_rs", label: "GIA RS" },
  { key: "drcst", label: "DRCST" },
  { key: "sped_fiscal", label: "SPED FISCAL" },
  { key: "sped_contr", label: "SPED CONTR" },
  { key: "reinf", label: "REINF" },
  { key: "dirbi", label: "DIRBI" },
  { key: "mit", label: "MIT" },
];

/** Valor especial: pintado com a cor da tabela e herdado pelos meses seguintes. */
export const LUCRO_DESABILITADO = "Desabilitado";

/** Opções das listas suspensas das colunas de obrigação. */
export const LUCRO_OPTIONS = [
  "OK",
  "SM",
  "X",
  "Dispensada",
  "Pendências",
  LUCRO_DESABILITADO,
] as const;

/** Cores das opções (padrão dos demais módulos). */
export const LUCRO_TONE: Record<string, string> = {
  OK: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  SM: "bg-status-info text-status-info-foreground hover:bg-status-info/90",
  X: "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
  Dispensada:
    "bg-status-neutral text-status-neutral-foreground hover:bg-status-neutral/80",
  "Pendências":
    "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
  [LUCRO_DESABILITADO]:
    "bg-status-disabled font-semibold text-status-disabled-foreground ring-1 ring-inset ring-white/40 hover:bg-status-disabled/90",
};

/** Indica o valor "Desabilitado" (segue para os próximos meses até ser alterado). */
export function isLucroDesabilitado(value: string | null | undefined): boolean {
  return value === LUCRO_DESABILITADO;
}
