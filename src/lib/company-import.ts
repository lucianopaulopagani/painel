import * as XLSX from "xlsx";
import { TRIBUTACOES } from "@/lib/companies";
import type {
  Department,
  DepartmentSubmenu,
  ProfileWithDepartments,
} from "@/lib/types";
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
  /** Nomes de subdepartamentos (separados por ";") — opcional. */
  subdepartamentos: string[];
}

export interface CompanyImportValidation {
  line: number;
  row: CompanyImportRow;
  errors: string[];
  department_ids: string[];
  /** Subdepartamentos marcados em cada departamento (department_id → nomes). */
  subdepartments_by_department: Record<string, string[]>;
  responsible_ids: string[];
}

/**
 * Colunas do modelo, na ordem posicional (usada quando o cabeçalho não é
 * reconhecido) com os nomes aceitos no cabeçalho.
 */
const COLUMNS: { key: string; header: string; aliases: string[] }[] = [
  { key: "numero", header: "Numero", aliases: ["numero", "n"] },
  { key: "name", header: "Nome", aliases: ["nome"] },
  { key: "documento", header: "CPF/CNPJ", aliases: ["cpf/cnpj", "documento"] },
  { key: "uf", header: "UF", aliases: ["uf"] },
  {
    key: "inscricaoEstadual",
    header: "Inscrição Estadual",
    aliases: ["inscricao estadual", "ie"],
  },
  { key: "tributacao", header: "Tributação", aliases: ["tributacao"] },
  { key: "departamentos", header: "Departamentos", aliases: ["departamentos"] },
  { key: "responsaveis", header: "Responsáveis", aliases: ["responsaveis"] },
  {
    key: "socioResponsavel",
    header: "Sócio Responsável",
    aliases: ["socio responsavel"],
  },
  { key: "socioCpf", header: "CPF do Sócio", aliases: ["cpf do socio"] },
  {
    key: "subdepartamentos",
    header: "Subdepartamentos",
    aliases: ["subdepartamentos"],
  },
];

const HEADERS = COLUMNS.map((column) => column.header);

/**
 * Índice de cada coluna. O cabeçalho é usado quando reconhecido, o que mantém
 * planilhas do modelo antigo (com a coluna "Data de Início") funcionando.
 */
function columnIndexes(header: unknown[]): Record<string, number> {
  const normalize = (value: unknown): string =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  const headers = header.map(normalize);
  const indexes: Record<string, number> = {};
  COLUMNS.forEach((column, position) => {
    const found = headers.findIndex((value) =>
      column.aliases.includes(value)
    );
    indexes[column.key] = found >= 0 ? found : position;
  });
  return indexes;
}

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
  users: ProfileWithDepartments[],
  submenus: DepartmentSubmenu[] = []
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
      "Movimento Fiscal",
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
    { wch: 32 },
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
      "Subdepartamentos:",
      "Opcional. Nomes separados por ponto e vírgula (;), marcados no departamento correspondente. As telas de cada módulo só mostram as empresas marcadas com o subdepartamento do módulo.",
    ],
    [
      "Responsáveis:",
      "Nomes separados por ponto e vírgula (;). São gravados como responsáveis de cada subdepartamento informado — os responsáveis são por subdepartamento.",
    ],
    [
      "Sócio:",
      "Sócio responsável (nome) e CPF do sócio são opcionais.",
    ],
    [
      "Datas por subdepartamento:",
      "As datas de início e final (mês/ano) são definidas por subdepartamento no cadastro da empresa: fora do período a empresa sai das tabelas do módulo.",
    ],
    ["Dica:", "Não altere a linha de cabeçalho."],
    [],
    ["Departamentos disponíveis:"],
    ...departments.map((d) => ["", d.name]),
    [],
    ["Subdepartamentos disponíveis:"],
    ...submenus.map((s) => [
      "",
      `${departments.find((d) => d.id === s.department_id)?.name ?? "—"} — ${s.name}`,
    ]),
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
  const columns = columnIndexes(rows[0] ?? []);

  return rows
    .slice(1)
    .filter((row) =>
      row.some((cell) => String(cell ?? "").trim() !== "")
    )
    .map((row) => {
      const get = (key: string) => String(row[columns[key]] ?? "").trim();
      return {
        numero: get("numero"),
        name: get("name"),
        documento: get("documento"),
        uf: get("uf").toUpperCase(),
        inscricaoEstadual: get("inscricaoEstadual"),
        tributacao: get("tributacao"),
        departamentos: get("departamentos")
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
        responsaveis: get("responsaveis")
          .split(";")
          .map((name) => name.trim())
          .filter(Boolean),
        socioResponsavel: get("socioResponsavel"),
        socioCpf: get("socioCpf"),
        subdepartamentos: get("subdepartamentos")
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
  users: ProfileWithDepartments[],
  submenus: DepartmentSubmenu[] = [],
  existingNumbers: string[] = []
): CompanyImportValidation[] {
  // O número da empresa não pode repetir (na base nem dentro do arquivo).
  const baseNumbers = new Set(
    existingNumbers.map((numero) => numero.trim()).filter(Boolean)
  );
  const usedNumbers = new Set(baseNumbers);
  const departmentByName = new Map(
    departments.map((d) => [d.name.toLocaleLowerCase("pt-BR"), d.id])
  );
  const userByName = new Map(
    users.map((u) => [u.full_name.toLocaleLowerCase("pt-BR"), u.id])
  );
  const submenuNameByDepartment = new Map<string, Set<string>>();
  for (const submenu of submenus) {
    const current =
      submenuNameByDepartment.get(submenu.department_id) ?? new Set<string>();
    current.add(submenu.name.toLocaleLowerCase("pt-BR"));
    submenuNameByDepartment.set(submenu.department_id, current);
  }

  return rows.map((row, index) => {
    const errors: string[] = [];

    if (!row.name) errors.push("Nome obrigatório");
    const numero = row.numero.trim();
    if (numero) {
      if (baseNumbers.has(numero)) errors.push("Número já cadastrado");
      else if (usedNumbers.has(numero))
        errors.push("Número repetido no arquivo");
      usedNumbers.add(numero);
    }
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

    // Subdepartamentos: cada nome é aplicado aos departamentos informados que o
    // possuem (o responsável do módulo é o do subdepartamento).
    const subdepartments_by_department: Record<string, string[]> = {};
    if (row.subdepartamentos.length > 0) {
      if (department_ids.length === 0) {
        errors.push("Subdepartamento informado sem departamento");
      }
      const unknown = row.subdepartamentos.filter(
        (name) =>
          !department_ids.some((departmentId) =>
            submenuNameByDepartment
              .get(departmentId)
              ?.has(name.toLocaleLowerCase("pt-BR"))
          )
      );
      if (unknown.length > 0) {
        errors.push("Há subdepartamento que não pertence ao departamento");
      }
      for (const departmentId of department_ids) {
        const names = row.subdepartamentos.filter((name) =>
          submenuNameByDepartment
            .get(departmentId)
            ?.has(name.toLocaleLowerCase("pt-BR"))
        );
        if (names.length > 0) {
          subdepartments_by_department[departmentId] = names.map(
            (name) =>
              submenus.find(
                (submenu) =>
                  submenu.department_id === departmentId &&
                  submenu.name.toLocaleLowerCase("pt-BR") ===
                    name.toLocaleLowerCase("pt-BR")
              )?.name ?? name
          );
        }
      }
    }

    return {
      line: index + 2,
      row,
      errors,
      department_ids,
      subdepartments_by_department,
      responsible_ids,
    };
  });
}
