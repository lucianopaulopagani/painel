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
import { usePonto, useSavePonto } from "@/hooks/use-ponto";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  defaultReferenceMonth,
} from "@/lib/fiscal-month";
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

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = usePonto(mes);
  const saveMutation = useSavePonto(mes);

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
                <TableHead className={`${HEAD} w-16`}>Nº</TableHead>
                <TableHead className={HEAD}>Empresa</TableHead>
                <TableHead className={`${HEAD} w-32`}>Envio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((company) => {
                  const envio = recordByCompany.get(company.id)?.envio ?? "";
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
                              "h-7 w-full min-w-0 px-1 text-xs",
                              envio === "Enviado" &&
                                "font-semibold text-status-success",
                              envio === "Pendente" &&
                                "font-semibold text-status-danger"
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
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    Nenhuma empresa vinculada ao departamento{" "}
                    {PESSOAL_DEPARTMENT_NAME}. Marque esse departamento no
                    cadastro de empresas para que elas apareçam aqui.
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
