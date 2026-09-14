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
import { useEmpresasFuncionarios, useEmpresasFuncionariosAll, useSaveEmpresasFuncionarios } from "@/hooks/use-empresas-funcionarios";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
  EMPRESAS_FUNC_ENVIO_OPTIONS,
  EMPRESAS_FUNC_FLAG_OPTIONS,
  EMPRESAS_FUNC_FOLHA_OPTIONS,
  EMPRESAS_FUNC_MESES_OPTIONS,
  EMPRESAS_FUNC_STATUS_OPTIONS,
} from "@/lib/empresas-funcionarios";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { formatCpfCnpj } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EmpresasFuncionariosInput } from "@/lib/types";

const STORAGE_KEY = "pessoal:empresas-funcionarios-mes";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

export default function EmpresasFuncionarios() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    status: "",
    numero: "",
    empresa: "",
    cnpj: "",
    tributacao: "",
    dataBase: "",
    folha: "",
    emprestimo: "",
    fgts: "",
    taxaSindical: "",
    dctfweb: "",
    envio: "",
    observacao: "",
    infoSindicato: "",
    infoSindicatoPatronal: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useEmpresasFuncionarios(mes);
  const { data: allRecords } = useEmpresasFuncionariosAll();
  const saveMutation = useSaveEmpresasFuncionarios(mes);

  const pessoal = findDepartmentByName(departments, PESSOAL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter((company) =>
      pessoal
        ? company.department_links.some(
            (link) => link.department_id === pessoal.id
          )
        : false
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) {
        return a.name.localeCompare(b.name, "pt-BR");
      }
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /**
   * Status efetivo: usa o registro do mês; se não existir, mantém
   * "Desativado" fixo caso o mês anterior mais recente seja Desativado.
   */
  const effectiveStatus = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.status;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.status === "Desativado" ? "Desativado" : null;
  };

  const isDesativada = (companyId: string): boolean =>
    effectiveStatus(companyId) === "Desativado";

  /**
   * Data Base efetiva: usa o registro do mês; se não existir, herda a do mês
   * anterior mais recente (levada para os meses seguintes).
   */
  const effectiveDataBase = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.data_base;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.data_base ?? null;
  };

  /**
   * Empréstimo efetivo: usa o registro do mês; se não existir, herda o do
   * mês anterior mais recente (levado para os meses seguintes).
   */
  const effectiveEmprestimo = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.emprestimo;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.emprestimo ?? null;
  };

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
    const match = (
      value: string | null | undefined,
      query: string
    ): boolean =>
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
      selectOrBlank(effectiveStatus(company.id), busca.status) &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      match(company.documento, busca.cnpj) &&
      match(company.tributacao, busca.tributacao) &&
      match(effectiveDataBase(company.id), busca.dataBase) &&
      match(record?.folha, busca.folha) &&
      selectOrBlank(effectiveEmprestimo(company.id), busca.emprestimo) &&
      selectOrBlank(record?.fgts, busca.fgts) &&
      selectOrBlank(record?.taxa_sindical, busca.taxaSindical) &&
      selectOrBlank(record?.dctfweb, busca.dctfweb) &&
      selectOrBlank(record?.envio, busca.envio) &&
      match(record?.observacao, busca.observacao) &&
      match(record?.info_sindicato, busca.infoSindicato) &&
      match(record?.info_sindicato_patronal, busca.infoSindicatoPatronal)
    );
  });

  const activeRows = filteredRows.filter(
    (company) => !isDesativada(company.id)
  );
  const inactiveRows = filteredRows.filter((company) =>
    isDesativada(company.id)
  );

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const effStatus = effectiveStatus(companyId);
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
        mes_referencia: mes,
        ...fields,
        status: effStatus ?? null,
        data_base: effectiveDataBase(companyId) ?? null,
        emprestimo: effectiveEmprestimo(companyId) ?? null,
        ...patch,
      } as unknown as EmpresasFuncionariosInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  const handleMonthChange = (value: string) => {
    setMes(value);
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
    patchKey: string,
    toneClass: Record<string, string> = {}
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
          toneClass[value]
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

  const renderTextCell = (
    companyId: string,
    value: string | null,
    patchKey: string
  ) => (
    <Input
      key={`${companyId}:${mes}:${patchKey}`}
      defaultValue={value ?? ""}
      title={value ?? ""}
      onBlur={(event) =>
        save(companyId, { [patchKey]: event.target.value.trim() || null })
      }
      className="h-7 w-full min-w-0 px-1 text-[11px]"
    />
  );

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[],
    widthClass = "w-28"
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

  const renderFilterInput = (key: keyof typeof busca, label: string) => (
    <TableHead className={`${HEAD} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const STATUS_TONE = {
    Concluído:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
    "Em Andamento":
      "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    "Em Ajuste": "bg-primary/10 text-primary hover:bg-primary/15",
    Desativado: "bg-muted text-muted-foreground hover:bg-muted/80",
  };
  const ENVIO_TONE = {
    Enviado: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente: "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
  };

  const renderRow = (company: (typeof rows)[number]) => {
    const record = recordByCompany.get(company.id);
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} w-40`}>
          {renderSelectCell(
            company.id,
            effectiveStatus(company.id) ?? "",
            EMPRESAS_FUNC_STATUS_OPTIONS,
            "status",
            STATUS_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} whitespace-nowrap font-medium`}>
          {company.numero || "—"}
        </TableCell>
        <TableCell className={`${CELL} w-40`}>
          <span className="block truncate font-medium" title={company.name}>
            {company.name}
          </span>
        </TableCell>
        <TableCell className={`${CELL} whitespace-nowrap text-muted-foreground`}>
          {formatCpfCnpj(company.documento)}
        </TableCell>
        <TableCell className={`${CELL} w-32`}>
          <span
            className="block truncate"
            title={company.tributacao ?? undefined}
          >
            {company.tributacao || "—"}
          </span>
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            effectiveDataBase(company.id) ?? "",
            EMPRESAS_FUNC_MESES_OPTIONS,
            "data_base"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            record?.folha ?? "",
            EMPRESAS_FUNC_FOLHA_OPTIONS,
            "folha"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            effectiveEmprestimo(company.id) ?? "",
            EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
            "emprestimo"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            record?.fgts ?? "",
            EMPRESAS_FUNC_FLAG_OPTIONS,
            "fgts"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            record?.taxa_sindical ?? "",
            EMPRESAS_FUNC_FLAG_OPTIONS,
            "taxa_sindical"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            record?.dctfweb ?? "",
            EMPRESAS_FUNC_FLAG_OPTIONS,
            "dctfweb"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            record?.envio ?? "",
            EMPRESAS_FUNC_ENVIO_OPTIONS,
            "envio",
            ENVIO_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-64`}>
          {renderTextCell(company.id, record?.observacao ?? null, "observacao")}
        </TableCell>
        <TableCell className={`${CELL} w-64`}>
          {renderTextCell(
            company.id,
            record?.info_sindicato ?? null,
            "info_sindicato"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-64`}>
          {renderTextCell(
            company.id,
            record?.info_sindicato_patronal ?? null,
            "info_sindicato_patronal"
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Empresas com funcionários</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="efun-mes">Mês de referência</Label>
        <Input
          id="efun-mes"
          type="month"
          value={mes}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="mt-1.5"
        />
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
          <Table className="table-fixed min-w-[1600px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {renderFilterSelect("status", "Status", EMPRESAS_FUNC_STATUS_OPTIONS, "w-40")}
                {renderFilterInput("numero", "Nº")}
                {renderFilterInput("empresa", "Empresa")}
                {renderFilterInput("cnpj", "CNPJ")}
                {renderFilterInput("tributacao", "Regime Tributário")}
                {renderFilterSelect("dataBase", "Data Base", EMPRESAS_FUNC_MESES_OPTIONS)}
                {renderFilterSelect("folha", "Folha", EMPRESAS_FUNC_FOLHA_OPTIONS)}
                {renderFilterSelect("emprestimo", "Empréstimo", EMPRESAS_FUNC_EMPRESTIMO_OPTIONS)}
                {renderFilterSelect("fgts", "FGTS", EMPRESAS_FUNC_FLAG_OPTIONS)}
                {renderFilterSelect("taxaSindical", "Taxa Sindical", EMPRESAS_FUNC_FLAG_OPTIONS)}
                {renderFilterSelect("dctfweb", "DCTFWEB", EMPRESAS_FUNC_FLAG_OPTIONS)}
                {renderFilterSelect("envio", "Envio", EMPRESAS_FUNC_ENVIO_OPTIONS)}
                {renderFilterInput("observacao", "Obs. Fechamento")}
                {renderFilterInput("infoSindicato", "Info. Sindicato")}
                {renderFilterInput("infoSindicatoPatronal", "Info. Sindicato Patronal")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={15}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    Empresas desativadas
                  </TableCell>
                </TableRow>
              )}
              {inactiveRows.map(renderRow)}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma empresa encontrada com os filtros."
                      : `Nenhuma empresa vinculada ao departamento ${PESSOAL_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`}
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
