import {
  ALVARA_ENVIADO_OPTIONS,
  ALVARA_GERADO_OPTIONS,
} from "@/lib/alvara-localizacao";
import { CERTIFICATE_PRODUCTS } from "@/lib/certificate-products";
import {
  CERTIFICATE_LEVELS,
  CERTIFICATE_SITUACAO_LABELS,
  CERTIFICATE_STATUS_LABELS,
} from "@/lib/certificate-status";
import {
  COMPLEMENTO_INSS_DARF_OPTIONS,
  COMPLEMENTO_INSS_ENVIO_OPTIONS,
} from "@/lib/complemento-inss";
import {
  BALANCETE_FECHAMENTO_OPTIONS,
  BALANCETE_MESES,
  BALANCETE_MES_OPTIONS,
} from "@/lib/contabil";
import {
  CONTABIL_DEPARTMENT_NAME,
  FISCAL_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
import {
  DOMESTICAS_DAE_OPTIONS,
  DOMESTICAS_ENVIO_OPTIONS,
  DOMESTICAS_FOLHA_OPTIONS,
  DOMESTICAS_MESES_OPTIONS,
  DOMESTICAS_PONTO_OPTIONS,
  DOMESTICAS_STATUS_OPTIONS,
} from "@/lib/domesticas";
import {
  EMPRESAS_FISCAL_DCTFWEB_OPTIONS,
  EMPRESAS_FISCAL_ENVIO_OPTIONS,
  EMPRESAS_FISCAL_STATUS_OPTIONS,
} from "@/lib/empresas-fiscal";
import {
  EMPRESAS_FUNC_DCTFWEB_OPTIONS,
  EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
  EMPRESAS_FUNC_ENVIO_OPTIONS,
  EMPRESAS_FUNC_FGTS_OPTIONS,
  EMPRESAS_FUNC_FLAG_OPTIONS,
  EMPRESAS_FUNC_FOLHA_OPTIONS,
  EMPRESAS_FUNC_MESES_OPTIONS,
  EMPRESAS_FUNC_STATUS_OPTIONS,
} from "@/lib/empresas-funcionarios";
import { dropdownFieldsFor, fiscalFormato } from "@/lib/fiscal-fields";
import {
  PARCELAMENTO_ENVIO_OPTIONS,
  PARCELAMENTO_FIELDS,
  PARCELAMENTO_OPTIONS,
} from "@/lib/parcelamentos";
import { PONTO_ENVIO_OPTIONS } from "@/lib/ponto";
import type { Tributacao } from "@/lib/types";

/**
 * Catálogo das tabelas de cada departamento e das colunas que elas exibem.
 *
 * O administrador altera em "Cadastro de Tabelas" (Admin) o nome das colunas e
 * as opções (nome e cor) das colunas de menu suspenso. O que está gravado no
 * banco vale por departamento; este catálogo diz o que cada tabela exibe, quais
 * colunas têm menu suspenso e quais são as listas padrão usadas enquanto não
 * houver cadastro.
 */

export interface ColunaCadastro {
  campo: string;
  /** Nome padrão da coluna no cabeçalho. */
  label: string;
  /** Opções padrão da coluna; quando existe, a coluna tem menu suspenso. */
  opcoes?: readonly string[];
  /** Observação exibida no cadastro quando as opções não são editáveis. */
  nota?: string;
}

export interface TabelaCadastro {
  nome: string;
  /** Colunas da tabela (vazio quando as colunas ainda não foram mapeadas). */
  colunas: ColunaCadastro[];
}

/** Opções de marcação Sim/Não (a primeira opção é o Sim). */
const SIM_NAO_OPTIONS = ["Sim", "Não"] as const;

/** Opções do certificado: os níveis na ordem em que são calculados. */
const CERTIFICATE_SITUACAO_OPTIONS = CERTIFICATE_LEVELS.map(
  (level) => CERTIFICATE_SITUACAO_LABELS[level]
);
const CERTIFICATE_STATUS_OPTIONS = CERTIFICATE_LEVELS.map(
  (level) => CERTIFICATE_STATUS_LABELS[level]
);

/** Nota das colunas cuja lista padrão vem do cadastro de empresas. */
const NOTA_LISTA_DO_CADASTRO =
  "A lista padrão vem do cadastro de empresas; as opções cadastradas aqui passam a ser a lista do filtro.";

/** Coluna UF (filtro com menu suspenso; a lista vem das empresas). */
const COLUNA_UF: ColunaCadastro = {
  campo: "uf",
  label: "UF",
  opcoes: [],
  nota: NOTA_LISTA_DO_CADASTRO,
};

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
  {
    key: "primary",
    label: "Azul principal",
    className: "bg-primary/10 text-primary hover:bg-primary/15",
    swatch: "bg-primary/40",
  },
  {
    key: "dark",
    label: "Grafite",
    className: "bg-zinc-800 text-zinc-100 hover:bg-zinc-800",
    swatch: "bg-zinc-800",
  },
  {
    key: "silver",
    label: "Prata",
    className: "bg-zinc-200 text-zinc-800 hover:bg-zinc-200",
    swatch: "bg-zinc-200",
  },
] as const;

/** Classe Tailwind (fundo + texto) da cor cadastrada para uma opção. */
export function statusColorClass(cor: string | null | undefined): string {
  return (
    STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.className ??
    "bg-muted text-muted-foreground hover:bg-muted/80"
  );
}

/**
 * Nome configurado equivalente a uma opção padrão: usa a opção que ocupa a mesma
 * posição na lista cadastrada, para as automações do sistema acompanharem o nome
 * escolhido na administração. Sem cadastro (ou com lista de tamanho diferente),
 * devolve o próprio valor padrão.
 */
export function opcaoEquivalente(
  configuradas: readonly string[],
  padrao: readonly string[],
  valor: string
): string {
  const index = padrao.indexOf(valor);
  if (index < 0 || configuradas.length !== padrao.length) return valor;
  return configuradas[index] ?? valor;
}

/* ----------------------------------------------------------- departamentos */

/** Departamentos cujas tabelas já leem o cadastro de nomes e opções. */
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
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "ie", label: "Insc. Estadual" },
  ],
  mei: [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
  ],
  "movimento-simples": [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "ie", label: "Insc. Estadual" },
  ],
  "carne-leao": [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
    { campo: "cpf", label: "CPF" },
  ],
  lucro: [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    COLUNA_UF,
  ],
  padrao: [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
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
  COLUNA_UF,
  {
    campo: "municipio",
    label: "Município",
    opcoes: [],
    nota: NOTA_LISTA_DO_CADASTRO,
  },
  { campo: "observacao", label: "Observação" },
  { campo: "venc_alvara", label: "Venc." },
  { campo: "gerado", label: "Gerado", opcoes: ALVARA_GERADO_OPTIONS },
  { campo: "enviado", label: "Enviado", opcoes: ALVARA_ENVIADO_OPTIONS },
];

/** Colunas das tabelas dos módulos (subdepartamentos) de cada departamento. */
const COLUNAS_POR_MODULO: Record<string, ColunaCadastro[]> = {
  /* Departamento Fiscal */
  "Controle de Parcelamentos": [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
    { campo: "documento", label: "CNPJ" },
    ...PARCELAMENTO_FIELDS.map((field) => ({
      campo: field.key,
      label: field.label,
      opcoes: PARCELAMENTO_OPTIONS,
    })),
    { campo: "envio", label: "Envio", opcoes: PARCELAMENTO_ENVIO_OPTIONS },
  ],

  /* Departamento Pessoal */
  "Empresas com funcionários": [
    {
      campo: "status",
      label: "Status",
      // A opção Desativado não é oferecida neste módulo.
      opcoes: EMPRESAS_FUNC_STATUS_OPTIONS.filter(
        (option) => option !== "Desativado"
      ),
    },
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "tributacao", label: "Tributação" },
    { campo: "dataBase", label: "Data Base", opcoes: EMPRESAS_FUNC_MESES_OPTIONS },
    { campo: "folha", label: "Folha", opcoes: EMPRESAS_FUNC_FOLHA_OPTIONS },
    {
      campo: "emprestimo",
      label: "Empréstimo",
      opcoes: EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
    },
    { campo: "fgts", label: "FGTS", opcoes: EMPRESAS_FUNC_FGTS_OPTIONS },
    {
      campo: "taxaSindical",
      label: "Taxa Sindical",
      opcoes: EMPRESAS_FUNC_FLAG_OPTIONS,
    },
    {
      campo: "dctfweb",
      label: "DCTFWEB",
      opcoes: EMPRESAS_FUNC_DCTFWEB_OPTIONS,
    },
    { campo: "envio", label: "Envio", opcoes: EMPRESAS_FUNC_ENVIO_OPTIONS },
    { campo: "notas", label: "Notas" },
  ],
  "Empresas Fiscal": [
    {
      campo: "status",
      label: "Status",
      opcoes: EMPRESAS_FISCAL_STATUS_OPTIONS,
    },
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "informacoes", label: "Informações fechamento" },
    {
      campo: "dctfweb",
      label: "DCTFWEB",
      opcoes: EMPRESAS_FISCAL_DCTFWEB_OPTIONS,
    },
    {
      campo: "envio",
      label: "Envio",
      // A opção Desativado não é oferecida neste módulo.
      opcoes: EMPRESAS_FISCAL_ENVIO_OPTIONS.filter(
        (option) => option !== "Desativado"
      ),
    },
  ],
  "Domésticas": [
    { campo: "status", label: "Status", opcoes: DOMESTICAS_STATUS_OPTIONS },
    { campo: "dataBase", label: "Data Base", opcoes: DOMESTICAS_MESES_OPTIONS },
    { campo: "numero", label: "Nº" },
    { campo: "nome", label: "Nome" },
    { campo: "cpf", label: "CPF" },
    { campo: "senha", label: "Senha" },
    { campo: "folha", label: "Folha", opcoes: DOMESTICAS_FOLHA_OPTIONS },
    { campo: "dae", label: "DAE", opcoes: DOMESTICAS_DAE_OPTIONS },
    { campo: "envio", label: "Envio", opcoes: DOMESTICAS_ENVIO_OPTIONS },
    { campo: "ponto", label: "Ponto", opcoes: DOMESTICAS_PONTO_OPTIONS },
  ],
  "Ponto": [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "envio", label: "Envio", opcoes: PONTO_ENVIO_OPTIONS },
  ],
  "Complemento INSS": [
    { campo: "numero", label: "Nº" },
    { campo: "empresa", label: "Empresa" },
    { campo: "observacoes", label: "Observações" },
    { campo: "darf", label: "DARF", opcoes: COMPLEMENTO_INSS_DARF_OPTIONS },
    {
      campo: "envio",
      label: "Envio",
      opcoes: COMPLEMENTO_INSS_ENVIO_OPTIONS,
    },
  ],

  /* Departamento Contábil */
  "Balancete/Balanço": [
    { campo: "numero", label: "Nº" },
    COLUNA_UF,
    { campo: "empresa", label: "Empresa" },
    ...BALANCETE_MESES.map((mes) => ({
      campo: mes.key,
      label: mes.label,
      opcoes: BALANCETE_MES_OPTIONS,
    })),
    {
      campo: "fechamento",
      label: "Fechamento",
      opcoes: BALANCETE_FECHAMENTO_OPTIONS,
    },
    { campo: "observacoes", label: "Obs." },
  ],

  /* Departamento Societário */
  "Certificado digital": [
    { campo: "vencimento", label: "Vencimento" },
    {
      campo: "situacao",
      label: "Situação",
      opcoes: CERTIFICATE_SITUACAO_OPTIONS,
      nota: "Calculada pelo vencimento: cada opção corresponde a um nível (Vencido, Vence hoje, Ativo e Sem vencimento). O texto da célula mostra os dias restantes e a pílula usa a cor cadastrada aqui.",
    },
    {
      campo: "status",
      label: "Status",
      opcoes: CERTIFICATE_STATUS_OPTIONS,
      nota: "Calculado pelo vencimento do certificado: cada opção corresponde a um nível, na mesma ordem da Situação.",
    },
    { campo: "empresa", label: "Empresa" },
    { campo: "socio", label: "Responsável" },
    { campo: "socioCpf", label: "CPF" },
    {
      campo: "produto",
      label: "Produto",
      opcoes: CERTIFICATE_PRODUCTS,
    },
    {
      campo: "avisado",
      label: "Avisado",
      opcoes: SIM_NAO_OPTIONS,
      nota: "Marcação do certificado: a primeira opção é o Sim.",
    },
    {
      campo: "financ",
      label: "Financ.",
      opcoes: SIM_NAO_OPTIONS,
      nota: "Marcação do certificado: a primeira opção é o Sim.",
    },
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
