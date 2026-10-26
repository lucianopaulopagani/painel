/**
 * Colunas de menu suspenso das tabelas do Movimento Fiscal.
 *
 * Cada tributação tem um conjunto de colunas com opções configuráveis no
 * painel de administração (Empresas → Tributações). Este catálogo liga o nome
 * da coluna (campo) ao rótulo e às opções padrão usadas quando a tributação
 * ainda não tem opções cadastradas.
 */
import { OK_SM_OPTIONS, SITUACAO_OPTIONS } from "@/lib/fiscal";
import {
  CARNE_LEAO_CARNE_OPTIONS,
  CARNE_LEAO_ENVIO_OPTIONS,
  CARNE_LEAO_ISS_OPTIONS,
  CARNE_LEAO_PRESTADOS_OPTIONS,
  CARNE_LEAO_TOMADOS_OPTIONS,
} from "@/lib/carne-leao";
import { LUCRO_FIELDS, LUCRO_OPTIONS } from "@/lib/fiscal-lucro-real";
import { isLucroTributacao } from "@/lib/fiscal-lucro-real";

export interface DropdownField {
  key: string;
  label: string;
  options: readonly string[];
}

/** Todas as colunas de menu suspenso do Movimento Fiscal. */
export const DROPDOWN_FIELDS: DropdownField[] = [
  { key: "situacao", label: "Status", options: SITUACAO_OPTIONS },
  { key: "das", label: "DAS", options: OK_SM_OPTIONS },
  { key: "guia", label: "Guia", options: OK_SM_OPTIONS },
  { key: "destda", label: "DESTDA", options: OK_SM_OPTIONS },
  { key: "envio_sn", label: "Envio/SN", options: OK_SM_OPTIONS },
  { key: "envio_icms", label: "Envio/ICMS", options: OK_SM_OPTIONS },
  { key: "prestados", label: "Prestados", options: CARNE_LEAO_PRESTADOS_OPTIONS },
  { key: "tomados", label: "Tomados", options: CARNE_LEAO_TOMADOS_OPTIONS },
  { key: "iss_fixo", label: "ISS Fixo", options: CARNE_LEAO_ISS_OPTIONS },
  { key: "carne_leao", label: "Carne Leão", options: CARNE_LEAO_CARNE_OPTIONS },
  { key: "envio_guia", label: "Envio/Guia", options: CARNE_LEAO_ENVIO_OPTIONS },
  ...LUCRO_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    options: LUCRO_OPTIONS,
  })),
];

const SIMPLES_FIELDS = [
  "situacao",
  "das",
  "guia",
  "destda",
  "envio_sn",
  "envio_icms",
];
const MEI_FIELDS = ["situacao", "das", "envio_sn"];
const CARNE_LEAO_FIELDS = [
  "situacao",
  "prestados",
  "tomados",
  "iss_fixo",
  "carne_leao",
  "envio_guia",
];
const LUCRO_KEYS = ["situacao", ...LUCRO_FIELDS.map((field) => field.key)];
/** Tributações com tabela enxuta: só a coluna Status. */
const SOMENTE_STATUS_TRIBUTACOES = [
  "Simples Nacional/SM-Mensal",
  "Empregada Doméstica",
  "Pessoa Física",
];

/** Colunas de menu suspenso que a tabela da tributação exibe. */
export function dropdownFieldsFor(
  tributacao: string | null | undefined
): DropdownField[] {
  const keys = !tributacao
    ? SIMPLES_FIELDS
    : tributacao === "Simples Nacional"
      ? SIMPLES_FIELDS
      : tributacao === "MEI"
        ? MEI_FIELDS
        : tributacao === "Carne Leão"
          ? CARNE_LEAO_FIELDS
          : isLucroTributacao(tributacao)
            ? LUCRO_KEYS
            : SOMENTE_STATUS_TRIBUTACOES.includes(tributacao)
              ? ["situacao"]
              : SIMPLES_FIELDS;

  return DROPDOWN_FIELDS.filter((field) => keys.includes(field.key));
}
