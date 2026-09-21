import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAlvaraLocalizacao,
  useAlvaraLocalizacaoAll,
  useSaveAlvaraLocalizacao,
} from "@/hooks/use-alvara-localizacao";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { SOCIETARIO_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyUsesSubmenu } from "@/lib/department-submenus";
import { isCompanyInactiveToday } from "@/lib/companies";
import {
  ALVARA_ENVIADO_OPTIONS,
  ALVARA_GERADO_OPTIONS,
  alvaraAnos,
} from "@/lib/alvara-localizacao";
import { formatCpfCnpj, cn } from "@/lib/utils";
import type { AlvaraLocalizacaoInput } from "@/lib/types";

const STORAGE_KEY = "societario:alvara-ano";

function readStoredAno(): string {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ?? String(new Date().getFullYear())
    );
  } catch {
    return String(new Date().getFullYear());
  }
}

/** Formata o vencimento no padrão dd/mm enquanto digita. */
function formatVencimento(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

export default function AlvaraLocalizacao() {
  const [ano, setAno] = useState<string>(readStoredAno);
  const [ufFiltro, setUfFiltro] = useState("todos");
  const [municipioFiltro, setMunicipioFiltro] = useState("todos");
  const [busca, setBusca] = useState({
    numero: "",
    empresa: "",
    cnpj: "",
    uf: "",
    municipio: "",
    observacao: "",
    vencimento: "",
    gerado: "",
    enviado: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useAlvaraLocalizacao(ano);
  const { data: allRecords } = useAlvaraLocalizacaoAll();
  const saveMutation = useSaveAlvaraLocalizacao(ano);

  const societario = findDepartmentByName(departments, SOCIETARIO_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter(
      (company) =>
        companyUsesSubmenu(company, societario?.id, "Alvará de Localização") &&
        !isCompanyInactiveToday(company)
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /** Observação efetiva: usa o ano atual; senão herda do ano anterior mais recente. */
  const effectiveObservacao = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current && current.observacao) return current.observacao;
    const prior = (allRecords ?? [])
      .filter((record) => record.company_id === companyId && record.ano < ano)
      .sort((a, b) => b.ano.localeCompare(a.ano));
    return prior.find((record) => record.observacao)?.observacao ?? null;
  };

  const ufOptions = Array.from(
    new Set(
      rows
        .map((company) => company.uf)
        .filter((uf): uf is string => Boolean(uf))
    )
  ).sort();

  const municipioOptions = Array.from(
    new Set(
      rows
        .filter((company) => ufFiltro === "todos" || company.uf === ufFiltro)
        .map((company) => company.municipio)
        .filter((municipio): municipio is string => Boolean(municipio))
    )
  ).sort();

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
    const match = (value: string | null | undefined, query: string): boolean =>
      !query ||
      (value ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR"));
    const selectOrBlank = (
      value: string | null | undefined,
      query: string
    ): boolean => {
      if (query === "branco") return !value;
      return !query || (value ?? "") === query;
    };
    return (
      (ufFiltro === "todos" || company.uf === ufFiltro) &&
      (municipioFiltro === "todos" || company.municipio === municipioFiltro) &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      match(company.documento, busca.cnpj) &&
      selectOrBlank(company.uf, busca.uf) &&
      selectOrBlank(company.municipio, busca.municipio) &&
      match(effectiveObservacao(company.id), busca.observacao) &&
      match(record?.vencimento, busca.vencimento) &&
      selectOrBlank(record?.gerado, busca.gerado) &&
      selectOrBlank(record?.enviado, busca.enviado)
    );
  });

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    const base = current ?? {};
    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...fields
    } = base;
    saveMutation.mutate(
      {
        company_id: companyId,
        ano,
        ...fields,
        observacao: effectiveObservacao(companyId) ?? null,
        ...patch,
      } as unknown as AlvaraLocalizacaoInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  const handleAnoChange = (value: string) => {
    setAno(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignora armazenamento indisponível
    }
  };

  const renderSelectCell = (
    companyId: string,
    value: string,
    options: readonly string[],
    patchKey: string
  ) => (
    <Select
      value={value === "" ? "none" : value}
      onValueChange={(next) =>
        save(companyId, { [patchKey]: next === "none" ? null : next })
      }
    >
      <SelectTrigger
        className={cn(
          "h-7 w-full min-w-0 px-1 text-xs font-semibold",
          value === "OK" &&
            "bg-status-success text-status-success-foreground hover:bg-status-success/90"
        )}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderFilterInput = (
    key: keyof typeof busca,
    label: string,
    widthClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[],
    widthClass = "w-24"
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Select
        value={busca[key] === "" ? "todos" : busca[key]}
        onValueChange={(value) =>
          setBuscaField(key, value === "todos" ? "" : value)
        }
      >
        <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="branco">Em branco</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Alvará de Localização</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="alvara-ano">Ano</Label>
          <Select value={ano} onValueChange={handleAnoChange}>
            <SelectTrigger id="alvara-ano" className="mt-1.5 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {alvaraAnos().map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="alvara-uf">UF</Label>
          <Select
            value={ufFiltro}
            onValueChange={(value) => {
              setUfFiltro(value);
              setMunicipioFiltro("todos");
            }}
          >
            <SelectTrigger id="alvara-uf" className="mt-1.5 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as UF</SelectItem>
              {ufOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="alvara-municipio">Município</Label>
          <Select value={municipioFiltro} onValueChange={setMunicipioFiltro}>
            <SelectTrigger id="alvara-municipio" className="mt-1.5 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="todos">Todos os municípios</SelectItem>
              {municipioOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as empresas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed min-w-[1240px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {renderFilterInput("numero", "Nº", "w-12")}
                {renderFilterInput("empresa", "Empresa", "w-56")}
                {renderFilterInput("cnpj", "CNPJ", "w-36")}
                {renderFilterSelect("uf", "UF", ufOptions, "w-16")}
                {renderFilterSelect(
                  "municipio",
                  "Município",
                  municipioOptions,
                  "w-40"
                )}
                {renderFilterInput("observacao", "Observação", "w-72")}
                {renderFilterInput("vencimento", "Venc.", "w-20")}
                {renderFilterSelect("gerado", "Gerado", ALVARA_GERADO_OPTIONS, "w-24")}
                {renderFilterSelect(
                  "enviado",
                  "Enviado",
                  ALVARA_ENVIADO_OPTIONS,
                  "w-24"
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((company) => {
                const record = recordByCompany.get(company.id);
                return (
                  <TableRow key={company.id}>
                    <TableCell className={`${CELL} whitespace-nowrap text-center font-medium`}>
                      {company.numero || "—"}
                    </TableCell>
                    <TableCell className={CELL}>
                      <span
                        className="block truncate font-medium"
                        title={company.name}
                      >
                        {company.name}
                      </span>
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap text-muted-foreground`}>
                      {formatCpfCnpj(company.documento)}
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap`}>
                      {company.uf || "—"}
                    </TableCell>
                    <TableCell className={CELL}>
                      <span
                        className="block truncate"
                        title={company.municipio ?? undefined}
                      >
                        {company.municipio || "—"}
                      </span>
                    </TableCell>
                    <TableCell className={`${CELL} w-72`}>
                      <Input
                        key={`${company.id}:${ano}:obs`}
                        defaultValue={effectiveObservacao(company.id) ?? ""}
                        title={effectiveObservacao(company.id) ?? ""}
                        onBlur={(event) =>
                          save(company.id, {
                            observacao: event.target.value.trim() || null,
                          })
                        }
                        className="h-7 w-full min-w-0 px-1 text-[11px]"
                      />
                    </TableCell>
                    <TableCell className={`${CELL} w-20`}>
                      <Input
                        key={`${company.id}:${ano}:venc`}
                        defaultValue={record?.vencimento ?? ""}
                        placeholder="xx/xx"
                        onBlur={(event) =>
                          save(company.id, {
                            vencimento: event.target.value.trim() || null,
                          })
                        }
                        onChange={(event) => {
                          event.target.value = formatVencimento(
                            event.target.value
                          );
                        }}
                        className="h-7 w-full min-w-0 px-1 text-[11px]"
                      />
                    </TableCell>
                    <TableCell className={`${CELL} w-24`}>
                      {renderSelectCell(
                        company.id,
                        record?.gerado ?? "",
                        ALVARA_GERADO_OPTIONS,
                        "gerado"
                      )}
                    </TableCell>
                    <TableCell className={`${CELL} w-24`}>
                      {renderSelectCell(
                        company.id,
                        record?.enviado ?? "",
                        ALVARA_ENVIADO_OPTIONS,
                        "enviado"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma empresa encontrada com os filtros."
                      : `Nenhuma empresa com o subdepartamento "Alvará de Localização" no departamento ${SOCIETARIO_DEPARTMENT_NAME}. Marque-o no cadastro de empresas para que elas apareçam aqui.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
