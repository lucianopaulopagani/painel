import { FISCAL_DEPARTMENT_NAME } from "@/lib/departments";
import { submenusOf } from "@/lib/department-submenus";
import { dropdownFieldsFor, fiscalFormato } from "@/lib/fiscal-fields";
import type { Tributacao } from "@/lib/types";

/**
 * Catálogo das tabelas de cada departamento e das colunas que elas exibem.
 *
 * O administrador altera em "Cadastro de Tabelas" (Admin) o nome das colunas e
 * as opções das colunas de menu suspenso. O que está gravado no banco vale por
 * departamento; este catálogo diz o que cada tabela exibe e quais são os nomes
 * padrão usados quando ainda não há cadastro.
 */

export interface ColunaCadastro {
  campo: string;
  /** Nome padrão da coluna no cabeçalho. */
  label: string;
  /** Opções padrão da coluna; quando existe, a coluna tem menu suspenso. */
  opcoes?: readonly string[];
}

export interface TabelaCadastro {
  nome: string;
  /** Colunas da tabela (vazio quando o departamento ainda não está integrado). */
  colunas: ColunaCadastro[];
}

/* ------------------------------------------------------------------ cores */

/** Cores disponíveis para as opções cadastradas (tons do design system). */
export const STATUS_COLOR_OPTIONS = [
  {
    key: "success",
    label: "Verde",
    className:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    swatch: "bg-status-success",
  },
  {
    key: "info",
    label: "Azul",
    className:
      "bg-status-info text-status-info-foreground hover:bg-status-info/90",
    swatch: "bg-status-info",
  },
  {
    key: "warning",
    label: "Âmbar",
    className:
      "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    swatch: "bg-status-warning",
  },
  {
    key: "danger",
    label: "Vermelho",
    className:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
    swatch: "bg-status-danger",
  },
  {
    key: "neutral",
    label: "Cinza",
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
    swatch: "bg-muted",
  },
  {
    key: "disabled",
    label: "Roxo",
    className:
      "bg-status-disabled text-status-disabled-foreground hover:bg-status-disabled/90",
    swatch: "bg-status-disabled",
  },
] as const;

/** Classe Tailwind (fundo + texto) da cor cadastrada para uma opção. */
export function statusColorClass(cor: string | null | undefined): string {
  return (
    STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.className ??
    "bg-muted text-muted-foreground hover:bg-muted/80"
  );
}

/* ----------------------------------------------------------- departamentos */

/** Departamentos cujas tabelas já leem o cadastro de nomes e opções. */
export const DEPARTAMENTOS_INTEGRADOS: readonly string[] = [
  FISCAL_DEPARTMENT_NAME,
];

/**
 * Tabelas do departamento informado. No Fiscal cada tabela é uma tributação
 * (Movimento Fiscal e subtabelas); nos demais departamentos, cada tabela é um
 * módulo (submenu) do painel.
 */
export function tabelasDoDepartamento(
  departamento: string | null | undefined,
  tributacoes: Tributacao[] | undefined
): TabelaCadastro[] {
  if (!departamento) return [];
  if (departamento === FISCAL_DEPARTMENT_NAME) {
    return (tributacoes ?? []).map((tributacao) => ({
      nome: tributacao.nome,
      colunas: colunasFiscais(tributacao.nome),
    }));
  }
  return submenusOf(departamento).map((nome) => ({ nome, colunas: [] }));
}

/* ------------------------------------------------------------- Fiscal */

/** Colunas fixas (sem menu suspenso), na ordem em que aparecem na tabela. */
const COLUNAS_FIXAS_FISCAL: Record<string, ColunaCadastro[]> = {
  simples: [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "ie", label: "Insc. Estadual" },
  ],
  mei: [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
  ],
  "movimento-simples": [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "ie", label: "Insc. Estadual" },
  ],
  "carne-leao": [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cpf", label: "CPF" },
  ],
  lucro: [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "uf", label: "UF" },
  ],
  padrao: [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
  ],
};

/** Colunas do Fiscal que ficam depois das colunas de menu suspenso. */
const COLUNA_OBSERVACOES: ColunaCadastro = {
  campo: "observacoes",
  label: "Observação",
};
const COLUNA_ACOES: ColunaCadastro = { campo: "acoes", label: "Ações" };

/** Colunas exibidas na tabela de uma tributação do Movimento Fiscal. */
function colunasFiscais(tributacao: string): ColunaCadastro[] {
  const formato = fiscalFormato(tributacao);
  const colunas: ColunaCadastro[] = [
    ...(COLUNAS_FIXAS_FISCAL[formato] ?? COLUNAS_FIXAS_FISCAL.padrao),
  ];
  for (const field of dropdownFieldsFor(tributacao)) {
    colunas.push({ campo: field.key, label: field.label, opcoes: field.options });
  }
  colunas.push(COLUNA_OBSERVACOES);
  // Só a tabela do Simples Nacional tem a coluna Ações (valores em R$).
  if (formato === "simples") colunas.push(COLUNA_ACOES);
  return colunas;
}
