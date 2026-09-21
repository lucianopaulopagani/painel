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
import { usePonto, usePontoAll, useSavePonto } from "@/hooks/use-ponto";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyUsesSubmenu } from "@/lib/department-submenus";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { isCompanyInactiveInMonth } from "@/lib/companies";
import { PONTO_ENVIO_OPTIONS } from "@/lib/ponto";
import { cn } from "@/lib/utils";
import type { PontoInput } from "@/lib/types";

const STORAGE_KEY = "pessoal:ponto-mes";

function readPontoMonth(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-2 py-1 text-xs";
const HEAD = "px-2 py-1 text-xs font-medium text-muted-foreground";

export default function Ponto() {
  const [mes, setMes] = useState<string>(readPontoMonth);
  const [busca, setBusca] = useState({ numero: "", empresa: "", envio: "" });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = usePonto(mes);
  const { data: allRecords } = usePontoAll();
  const saveMutation = useSavePonto(mes);

  const pessoal = findDepartmentByName(departments, PESSOAL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter(
      (company) =>
        companyUsesSubmenu(company, pessoal?.id, "Ponto") &&
        !isCompanyInactiveInMonth(company, mes)
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
   * Status efetivo da empresa no mês: usa o registro do mês; se não existir,
   * mantém "Desativado" fixo caso o mês anterior mais recente seja Desativado.
   */
  const effectiveEnvio = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.envio;
    const prior = (allRecords ?? [])
      .filter(
        (record) => record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.envio === "Desativado" ? "Desativado" : null;
  };

  const filteredRows = rows.filter((company) => {
    const envio = effectiveEnvio(company.id) ?? "";
    const match = (
      value: string | null | undefined,
      query: string
    ): boolean =>
      !query ||
      (value ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR"));
    const envioFilter = (
      value: string | null | undefined,
      query: string
    ): boolean => {
      if (query === "branco") return !value;
      return !query || (value ?? "") === query;
    };
    return (
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      envioFilter(envio, busca.envio)
    );
  });

  const activeRows = filteredRows.filter(
    (company) => effectiveEnvio(company.id) !== "Desativado"
  );
  const inactiveRows = filteredRows.filter(
    (company) => effectiveEnvio(company.id) === "Desativado"
  );

  const save = (companyId: string, envio: string | null) => {
    saveMutation.mutate(
      {
        company_id: companyId,
        mes_referencia: mes,
        envio,
      } as PontoInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar o envio."
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
    const envio = effectiveEnvio(company.id) ?? "";
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} whitespace-nowrap font-medium`}>
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
        <TableCell className={CELL}>
          <Select
            value={envio === "" ? "none" : envio}
            onValueChange={(value) =>
              save(company.id, value === "none" ? null : value)
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
              {PONTO_ENVIO_OPTIONS.map((option) => (
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
        <h2 className="text-lg font-semibold">Ponto</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="ponto-mes">Mês de referência</Label>
        <Input
          id="ponto-mes"
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
        <div className="rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={`${HEAD} w-16 align-bottom`}>
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
                <TableHead className={`${HEAD} align-bottom`}>
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
                  <div className="mb-1">Envio</div>
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
                      {PONTO_ENVIO_OPTIONS.map((option) => (
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
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={3}
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
                    colSpan={3}
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
