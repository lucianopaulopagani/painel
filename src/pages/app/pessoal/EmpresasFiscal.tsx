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
  useEmpresasFiscal,
  useEmpresasFiscalAll,
  useSaveEmpresasFiscal,
} from "@/hooks/use-empresas-fiscal";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  EMPRESAS_FISCAL_DCTFWEB_OPTIONS,
  EMPRESAS_FISCAL_ENVIO_OPTIONS,
  EMPRESAS_FISCAL_STATUS_OPTIONS,
} from "@/lib/empresas-fiscal";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { formatCpfCnpj } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EmpresasFiscalInput, EmpresasFiscalRecord } from "@/lib/types";

const STORAGE_KEY = "pessoal:empresas-fiscal-mes";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Opções de envio exibidas nas linhas e filtros (sem "Desativado"). */
const ENVIO_SELECT_OPTIONS = EMPRESAS_FISCAL_ENVIO_OPTIONS.filter(
  (option) => option !== "Desativado"
);

export default function EmpresasFiscal() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    status: "",
    numero: "",
    empresa: "",
    cnpj: "",
    informacoes: "",
    dctfweb: "",
    envio: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useEmpresasFiscal(mes);
  const { data: allRecords } = useEmpresasFiscalAll();
  const saveMutation = useSaveEmpresasFiscal(mes);

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

  const recordByCompany = new Map<string, EmpresasFiscalRecord>(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /**
   * Valores efetivos no mês: usa o registro do mês; se não existir, carrega do
   * mês anterior mais recente — mantém "Desativado" fixo (status/envio) e
   * herda "informações de fechamento" e DCTFWEB.
   */
  const effectiveFields = (
    companyId: string
  ): {
    status: string | null;
    envio: string | null;
    informacoes: string | null;
    dctfweb: string | null;
  } => {
    const current = recordByCompany.get(companyId);
    if (current) {
      return {
        status: current.status,
        envio: current.envio,
        informacoes: current.informacoes,
        dctfweb: current.dctfweb,
      };
    }
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    const latest = prior[0];
    return {
      status: latest?.status === "Desativado" ? "Desativado" : null,
      envio: latest?.envio === "Desativado" ? "Desativado" : null,
      informacoes: latest?.informacoes ?? null,
      dctfweb: latest?.dctfweb ?? null,
    };
  };

  const isDesativada = (companyId: string): boolean => {
    const { status, envio } = effectiveFields(companyId);
    return status === "Desativado" || envio === "Desativado";
  };

  const filteredRows = rows.filter((company) => {
    const { status, envio, informacoes, dctfweb } =
      effectiveFields(company.id);
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
      selectOrBlank(status, busca.status) &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      match(company.documento, busca.cnpj) &&
      match(informacoes, busca.informacoes) &&
      selectOrBlank(dctfweb, busca.dctfweb) &&
      selectOrBlank(envio, busca.envio)
    );
  });

  const displayActiveRows = filteredRows.filter(
    (company) => !isDesativada(company.id)
  );
  const displayInactiveRows = filteredRows.filter((company) =>
    isDesativada(company.id)
  );

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const eff = effectiveFields(companyId);
    saveMutation.mutate(
      {
        company_id: companyId,
        mes_referencia: mes,
        status: eff.status ?? null,
        envio: eff.envio ?? null,
        informacoes: eff.informacoes ?? null,
        dctfweb: eff.dctfweb ?? null,
        ...patch,
      } as unknown as EmpresasFiscalInput,
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

  const renderRow = (company: (typeof rows)[number]) => {
    const {
      status: statusEff,
      envio: envioEff,
      informacoes: infoEff,
      dctfweb: dctfwebEff,
    } = effectiveFields(company.id);
    const status = statusEff ?? "";
    const dctfweb = dctfwebEff ?? "";
    const envio = envioEff ?? "";
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} w-20`}>
          <Select
            value={status === "" ? "none" : status}
            onValueChange={(value) =>
              save(company.id, { status: value === "none" ? null : value })
            }
          >
            <SelectTrigger
              className={cn(
                "h-7 w-full min-w-0 px-1 text-xs font-semibold",
                status === "Concluído" &&
                  "bg-status-success text-status-success-foreground hover:bg-status-success/90",
                status === "Pendente" &&
                  "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
                status === "Desativado" &&
                  "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {EMPRESAS_FISCAL_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className={`${CELL} whitespace-nowrap font-medium`}>
          {company.numero || "—"}
        </TableCell>
        <TableCell className={CELL}>
          <span className="block truncate font-medium" title={company.name}>
            {company.name}
          </span>
        </TableCell>
        <TableCell className={`${CELL} whitespace-nowrap text-muted-foreground`}>
          {formatCpfCnpj(company.documento)}
        </TableCell>
        <TableCell className={CELL}>
          <Input
            key={`${company.id}:${mes}`}
            defaultValue={infoEff ?? ""}
            title={infoEff ?? ""}
            onBlur={(event) =>
              save(company.id, {
                informacoes: event.target.value.trim() || null,
              })
            }
            className="h-7 w-full min-w-0 px-1 text-[11px]"
          />
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          <Select
            value={dctfweb === "" ? "none" : dctfweb}
            onValueChange={(value) =>
              save(company.id, { dctfweb: value === "none" ? null : value })
            }
          >
            <SelectTrigger
              className={cn(
                "h-7 w-full min-w-0 px-1 text-xs font-semibold",
                dctfweb === "OK" &&
                  "bg-status-success text-status-success-foreground hover:bg-status-success/90"
              )}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {EMPRESAS_FISCAL_DCTFWEB_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          <Select
            value={envio === "" ? "none" : envio}
            onValueChange={(value) =>
              save(company.id, { envio: value === "none" ? null : value })
            }
          >
            <SelectTrigger
              className={cn(
                "h-7 w-full min-w-0 px-1 text-xs font-semibold",
                envio === "Enviado" &&
                  "bg-status-success text-status-success-foreground hover:bg-status-success/90",
                envio === "Pendente" &&
                  "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
                envio === "Desativado" &&
                  "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
                      {ENVIO_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
          </Select>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Empresas Fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="ef-mes">Mês de referência</Label>
        <Input
          id="ef-mes"
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
          <Table className="table-fixed min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={`${HEAD} w-24 align-bottom`}>
                  <span className="mb-1 block">Status</span>
                  <Select
                    value={busca.status === "" ? "todos" : busca.status}
                    onValueChange={(value) =>
                      setBuscaField("status", value === "todos" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="branco">Em branco</SelectItem>
                      {EMPRESAS_FISCAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className={`${HEAD} w-14 align-bottom`}>
                  <span className="mb-1 block">Nº</span>
                  <Input
                    value={busca.numero}
                    onChange={(e) =>
                      setBuscaField("numero", e.target.value)
                    }
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead className={`${HEAD} w-36 align-bottom`}>
                  <span className="mb-1 block">Empresa</span>
                  <Input
                    value={busca.empresa}
                    onChange={(e) =>
                      setBuscaField("empresa", e.target.value)
                    }
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead className={`${HEAD} w-36 align-bottom`}>
                  <span className="mb-1 block">CNPJ</span>
                  <Input
                    value={busca.cnpj}
                    onChange={(e) => setBuscaField("cnpj", e.target.value)}
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead className={`${HEAD} w-64 align-bottom`}>
                  <span className="mb-1 block">Informações fechamento</span>
                  <Input
                    value={busca.informacoes}
                    onChange={(e) =>
                      setBuscaField("informacoes", e.target.value)
                    }
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead className={`${HEAD} w-24 align-bottom`}>
                  <span className="mb-1 block">DCTFWEB</span>
                  <Select
                    value={busca.dctfweb === "" ? "todos" : busca.dctfweb}
                    onValueChange={(value) =>
                      setBuscaField("dctfweb", value === "todos" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="branco">Em branco</SelectItem>
                      {EMPRESAS_FISCAL_DCTFWEB_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className={`${HEAD} w-28 align-bottom`}>
                  <span className="mb-1 block">Envio</span>
                  <Select
                    value={busca.envio === "" ? "todos" : busca.envio}
                    onValueChange={(value) =>
                      setBuscaField("envio", value === "todos" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="branco">Em branco</SelectItem>
                      {ENVIO_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayActiveRows.map(renderRow)}
              {displayInactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={7}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    Empresas desativadas
                  </TableCell>
                </TableRow>
              )}
              {displayInactiveRows.map(renderRow)}
              {displayActiveRows.length === 0 &&
                displayInactiveRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
