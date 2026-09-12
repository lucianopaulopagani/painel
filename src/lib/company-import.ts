import * as XLSX from "xlsx";
import type { Department, ProfileWithDepartments } from "@/lib/types";
import { isValidCpfCnpj } from "@/lib/utils";

export interface CompanyImportRow {
  numero: string;
  name: string;
  documento: string;
  uf: string;
  inscricaoEstadual: string;
  /** Nomes de departamentos (separados por ";") */
  departamentos: string[];
  /** Nomes de responsáveis (separados por ";") */
  responsaveis: string[];
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
  "Departamentos",
  "Responsáveis",
];

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
      "Depart. Fiscal;Societário",
      "Elizandra;Jannaina",
    ],
  ]);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 22 },
    { wch: 6 },
    { wch: 22 },
    { wch: 40 },
    { wch: 40 },
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
        departamentos: get(5)
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
        responsaveis: get(6)
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
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
