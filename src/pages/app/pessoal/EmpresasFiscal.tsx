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

export default function EmpresasFiscal() {
  const [mes, setMes] = useState<string>(readStoredMes);

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
   * Status/Envio efetivos no mês: usa o registro do mês; se não existir,
   * mantém "Desativado" fixo caso o mês anterior mais recente seja Desativado
   * (em status ou envio) até ser alterado novamente.
   */
  const effectiveFields = (
    companyId: string
  ): { status: string | null; envio: string | null } => {
    const current = recordByCompany.get(companyId);
    if (current) {
      return { status: current.status, envio: current.envio };
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
    };
  };

  const isDesativada = (companyId: string): boolean => {
    const { status, envio } = effectiveFields(companyId);
    return status === "Desativado" || envio === "Desativado";
  };

  const activeRows = rows.filter(
    (company) => !isDesativada(company.id)
  );
  const inactiveRows = rows.filter((company) => isDesativada(company.id));

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    const base: Partial<EmpresasFiscalRecord> = current ?? {};
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
    const record = recordByCompany.get(company.id);
    const { status: statusEff, envio: envioEff } = effectiveFields(company.id);
    const status = statusEff ?? "";
    const dctfweb = record?.dctfweb ?? "";
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
            defaultValue={record?.informacoes ?? ""}
            title={record?.informacoes ?? ""}
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
              {EMPRESAS_FISCAL_ENVIO_OPTIONS.map((option) => (
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
                <TableHead className={`${HEAD} w-20`}>Status</TableHead>
                <TableHead className={`${HEAD} w-12`}>Nº</TableHead>
                <TableHead className={`${HEAD} w-32`}>Empresa</TableHead>
                <TableHead className={`${HEAD} w-36`}>CNPJ</TableHead>
                <TableHead className={`${HEAD} w-64`}>
                  Informações fechamento
                </TableHead>
                <TableHead className={`${HEAD} w-16`}>DCTFWEB</TableHead>
                <TableHead className={`${HEAD} w-20`}>Envio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={7}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    Empresas desativadas
                  </TableCell>
                </TableRow>
              )}
              {inactiveRows.map(renderRow)}
              {activeRows.length === 0 && inactiveRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {`Nenhuma empresa vinculada ao departamento ${PESSOAL_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`}
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
