import { PARCELAMENTO_FIELDS } from "@/lib/parcelamentos";
import {
  CONTABIL_DEPARTMENT_NAME,
  FISCAL_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
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
  /** Colunas da tabela (vazio quando as colunas ainda não foram mapeadas). */
  colunas: ColunaCadastro[];
}

/** Nome do subdepartamento que reúne as tabelas do Movimento Fiscal. */
export const MOVIMENTO_FISCAL_SUBMENU = "Movimento Fiscal";

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

/** Departamentos cujas tabelas já leem o cadastro de nomes. */
export const DEPARTAMENTOS_INTEGRADOS: readonly string[] = [
  FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  CONTABIL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
];

/* ---------------------------------------------------------- Fiscal */

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

/* ------------------------------------------------------ demais módulos */

/** Colunas das tabelas de Alvará (localização, sanitário e bombeiros). */
const COLUNAS_ALVARA: ColunaCadastro[] = [
  { campo: "numero", label: "Nº" },
  { campo: "empresa", label: "Empresa" },
  { campo: "cnpj", label: "CNPJ" },
  { campo: "uf", label: "UF" },
  { campo: "municipio", label: "Município" },
  { campo: "observacao", label: "Observação" },
  { campo: "venc_alvara", label: "Venc." },
  { campo: "gerado", label: "Gerado" },
  { campo: "enviado", label: "Enviado" },
];

/** Colunas das tabelas dos módulos (subdepartamentos) de cada departamento. */
const COLUNAS_POR_MODULO: Record<string, ColunaCadastro[]> = {
  /* Departamento Fiscal */
  "Controle de Parcelamentos": [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
    { campo: "documento", label: "CNPJ" },
    ...PARCELAMENTO_FIELDS.map((field) => ({
      campo: field.key,
      label: field.label,
    })),
    { campo: "envio", label: "Envio" },
  ],

  /* Departamento Pessoal */
  "Empresas com funcionários": [
    { campo: "status", label: "Status" },
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "tributacao", label: "Tributação" },
    { campo: "dataBase", label: "Data Base" },
    { campo: "folha", label: "Folha" },
    { campo: "emprestimo", label: "Empréstimo" },
    { campo: "fgts", label: "FGTS" },
    { campo: "taxaSindical", label: "Taxa Sindical" },
    { campo: "dctfweb", label: "DCTFWEB" },
    { campo: "envio", label: "Envio" },
    { campo: "notas", label: "Notas" },
  ],
  "Empresas Fiscal": [
    { campo: "status", label: "Status" },
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "informacoes", label: "Informações fechamento" },
    { campo: "dctfweb", label: "DCTFWEB" },
    { campo: "envio", label: "Envio" },
  ],
  "Domésticas": [
    { campo: "status", label: "Status" },
    { campo: "dataBase", label: "Data Base" },
    { campo: "numero", label: "Nº" },
    { campo: "nome", label: "Nome" },
    { campo: "cpf", label: "CPF" },
    { campo: "senha", label: "Senha" },
    { campo: "folha", label: "Folha" },
    { campo: "dae", label: "DAE" },
    { campo: "envio", label: "Envio" },
    { campo: "ponto", label: "Ponto" },
  ],
  "Ponto": [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "envio", label: "Envio" },
  ],
  "Complemento INSS": [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "observacoes", label: "Observações" },
    { campo: "darf", label: "DARF" },
    { campo: "envio", label: "Envio" },
  ],

  /* Departamento Contábil */
  "Balancete/Balanço": [
    { campo: "numero", label: "Nº" },
    { campo: "uf", label: "UF" },
    { campo: "empresa", label: "Empresa" },
    { campo: "fechamento", label: "Fechamento" },
    { campo: "observacoes", label: "Obs." },
  ],

  /* Departamento Societário */
  "Certificado digital": [
    { campo: "vencimento", label: "Vencimento" },
    { campo: "situacao", label: "Situação" },
    { campo: "status", label: "Status" },
    { campo: "empresa", label: "Empresa" },
    { campo: "socio", label: "Responsável" },
    { campo: "socioCpf", label: "CPF" },
    { campo: "produto", label: "Produto" },
    { campo: "avisado", label: "Avisado" },
    { campo: "financ", label: "Financ." },
    { campo: "agendamento", label: "Agendamento" },
    { campo: "observacoes", label: "Observações" },
    { campo: "acoes", label: "Ações" },
  ],
  "Alvará localização": COLUNAS_ALVARA,
  "Alvará Sanitário": COLUNAS_ALVARA,
  "Alvará Bombeiros": COLUNAS_ALVARA,
};

export interface TabelasDoDepartamentoInput {
  /** Tributações cadastradas (cada uma é uma tabela do Movimento Fiscal). */
  tributacoes?: Tributacao[];
  /** Nomes dos subdepartamentos (módulos) do departamento, em ordem. */
  submenus?: string[];
}

/** Tabelas de módulos do departamento (sem as tabelas do Movimento Fiscal). */
export function tabelasDeModulos(
  departamento: string | null | undefined,
  submenus: string[] | undefined
): TabelaCadastro[] {
  return (submenus ?? [])
    .filter(
      (nome) =>
        !(departamento === FISCAL_DEPARTMENT_NAME && nome === MOVIMENTO_FISCAL_SUBMENU)
    )
    .map((nome) => ({ nome, colunas: COLUNAS_POR_MODULO[nome] ?? [] }));
}

/**
 * Todas as tabelas do departamento: no Fiscal as tributaçãoes do Movimento
 * Fiscal e, depois, os demais módulos; nos outros departamentos, os módulos.
 */
export function tabelasDoDepartamento(
  departamento: string | null | undefined,
  { tributacoes = [], submenus = [] }: TabelasDoDepartamentoInput = {}
): TabelaCadastro[] {
  if (!departamento) return [];
  if (departamento === FISCAL_DEPARTMENT_NAME) {
    return [
      ...tributacoes.map((tributacao) => ({
        nome: tributacao.nome,
        colunas: colunasFiscais(tributacao.nome),
      })),
      ...tabelasDeModulos(departamento, submenus),
    ];
  }
  return tabelasDeModulos(departamento, submenus);
}
