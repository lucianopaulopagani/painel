import * as XLSX from "xlsx";
import { TRIBUTACOES } from "@/lib/companies";
import type { Department, ProfileWithDepartments } from "@/lib/types";
import { isValidCpfCnpj } from "@/lib/utils";

export interface CompanyImportRow {
  numero: string;
  name: string;
  documento: string;
  uf: string;
  inscricaoEstadual: string;
  tributacao: string;
  /** Nomes de departamentos (separados por ";") */
  departamentos: string[];
  /** Nomes de responsáveis (separados por ";") */
  responsaveis: string[];
  socioResponsavel: string;
  socioCpf: string;
  /** Data de Início (YYYY-MM-DD) ou vazia. */
  dataInicio: string;
}

export interface CompanyImportValidation {
  line: number;
  row: CompanyImportRow;
  errors: string[];
  department_ids: string[];
  responsible_ids: string[];
}

const HEADERS = [
  "Numero",
  "Nome",
  "CPF/CNPJ",
  "UF",
  "Inscrição Estadual",
  "Tributação",
  "Departamentos",
  "Responsáveis",
  "Sócio Responsável",
  "CPF do Sócio",
  "Data de Início",
];

/** Converte um valor de célula em data ISO (AAAA-MM-DD) ou null. */
export function parseImportDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Data serial do Excel (dias desde 30/12/1899).
    const utc = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return toIsoDate(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
  }
  const text = String(value).trim();
  if (!text) return null;
  const br = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (br) {
    const year = Number(br[3].length === 2 ? `20${br[3]}` : br[3]);
    return toIsoDate(year, Number(br[2]), Number(br[1]));
  }
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  return null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

/** Gera e baixa o modelo (planilha Excel) para importação. */
export function buildCompanyImportTemplate(
  departments: Department[],
  users: ProfileWithDepartments[]
): void {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    [
      "001",
      "EMPRESA EXEMPLO LTDA",
      "00.000.000/0000-00",
      "SC",
      "",
      "Simples Nacional",
      "Depart. Fiscal;Societário",
      "Elizandra;Jannaina",
      "ELIZANDRA PEREIRA",
      "000.000.000-00",
      "01/01/2026",
    ],
  ]);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 22 },
    { wch: 6 },
    { wch: 22 },
    { wch: 22 },
    { wch: 40 },
    { wch: 40 },
    { wch: 28 },
    { wch: 20 },
    { wch: 16 },
  ];

  const helpRows: string[][] = [
    ["Guia de preenchimento"],
    [],
    ["Obrigatórias:", "Nome, CPF/CNPJ (11 ou 14 dígitos) e UF."],
    [
      "Departamentos:",
      "Nomes separados por ponto e vírgula (;) conforme cadastrados no sistema.",
    ],
    [
      "Responsáveis:",
      "Nomes separados por ponto e vírgula (;), aplicados aos departamentos informados.",
    ],
    [
      "Sócio:",
      "Sócio responsável (nome) e CPF do sócio são opcionais.",
    ],
    [
      "Data de Início:",
      "Opcional, no formato dd/mm/aaaa (ex.: 01/01/2026) ou aaaa-mm-dd. Períodos anteriores ficam bloqueados nos departamentos.",
    ],
    ["Dica:", "Não altere a linha de cabeçalho."],
    [],
    ["Departamentos disponíveis:"],
    ...departments.map((d) => ["", d.name]),
    [],
    ["Responsáveis disponíveis:"],
    ...users.map((u) => ["", u.full_name]),
  ];
  const helpWs = XLSX.utils.aoa_to_sheet(helpRows);
  helpWs["!cols"] = [{ wch: 28 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Empresas");
  XLSX.utils.book_append_sheet(wb, helpWs, "Ajuda");
  XLSX.writeFile(wb, "modelo-importacao-empresas.xlsx");
}

/** Lê o arquivo (xlsx/xls/csv) e devolve as linhas de empresas. */
export function parseCompanyImportFile(
  data: ArrayBuffer
): CompanyImportRow[] {
  const wb = XLSX.read(data);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  return rows
    .slice(1)
    .filter((row) =>
      row.some((cell) => String(cell ?? "").trim() !== "")
    )
    .map((row) => {
      const get = (index: number) => String(row[index] ?? "").trim();
      return {
        numero: get(0),
        name: get(1),
        documento: get(2),
        uf: get(3).toUpperCase(),
        inscricaoEstadual: get(4),
        tributacao: get(5),
        departamentos: get(6)
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
        responsaveis: get(7)
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
        socioResponsavel: get(8),
        socioCpf: get(9),
        // Célula pode vir como data do Excel, número serial ou texto.
        dataInicio: parseImportDate(row[10] as unknown) ?? get(10),
      };
    });
}

/** Valida as linhas e resolve nomes de departamentos/responsáveis em ids. */
export function validateCompanyImportRows(
  rows: CompanyImportRow[],
  departments: Department[],
  users: ProfileWithDepartments[]
): CompanyImportValidation[] {
  const departmentByName = new Map(
    departments.map((d) => [d.name.toLocaleLowerCase("pt-BR"), d.id])
  );
  const userByName = new Map(
    users.map((u) => [u.full_name.toLocaleLowerCase("pt-BR"), u.id])
  );

  return rows.map((row, index) => {
    const errors: string[] = [];

    if (!row.name) errors.push("Nome obrigatório");
    if (!isValidCpfCnpj(row.documento)) {
      errors.push("CPF/CNPJ inválido (11 ou 14 dígitos)");
    }
    if (!row.uf) errors.push("UF obrigatória");
    if (
      row.tributacao &&
      !TRIBUTACOES.some(
        (option) => option.toLowerCase() === row.tributacao.toLowerCase()
      )
    ) {
      errors.push("Tributação desconhecida");
    }
    if (
      row.socioCpf &&
      row.socioCpf.replace(/\D/g, "").length !== 11
    ) {
      errors.push("CPF do sócio inválido (11 dígitos)");
    }
    if (row.dataInicio && !parseImportDate(row.dataInicio)) {
      errors.push("Data de Início inválida (use dd/mm/aaaa)");
    }

    const department_ids = row.departamentos
      .map((name) => departmentByName.get(name.toLocaleLowerCase("pt-BR")))
      .filter((id): id is string => Boolean(id));
    if (
      row.departamentos.length > 0 &&
      department_ids.length !== row.departamentos.length
    ) {
      errors.push("Há departamento desconhecido");
    }

    const responsible_ids = row.responsaveis
      .map((name) => userByName.get(name.toLocaleLowerCase("pt-BR")))
      .filter((id): id is string => Boolean(id));
    if (
      row.responsaveis.length > 0 &&
      responsible_ids.length !== row.responsaveis.length
    ) {
      errors.push("Há responsável desconhecido");
    }

    return {
      line: index + 2,
      row,
      errors,
      department_ids,
      responsible_ids,
    };
  });
}
