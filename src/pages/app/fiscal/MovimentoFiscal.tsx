import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useMovimentoFiscal, useSaveMovimentoFiscal } from "@/hooks/use-movimento-fiscal";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  MOVIMENTO_FISCAL_FIELDS,
  SITUACAO_OPTIONS,
} from "@/lib/fiscal";
import type {
  MovementFiscalInput,
  MovementFiscalRecord,
} from "@/lib/types";

const STORAGE_KEY = "fiscal:mes-referencia";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function readStoredMonth(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? currentMonth();
  } catch {
    return currentMonth();
  }
}

export function MovimentoFiscal() {
  const [mes, setMes] = useState<string>(readStoredMonth);

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useMovimentoFiscal(mes);
  const saveMutation = useSaveMovimentoFiscal(mes);

  const fiscal = findDepartmentByName(departments, FISCAL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter((company) =>
      fiscal
        ? company.department_links.some(
            (link) => link.department_id === fiscal.id
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

  const recordByCompany = new Map<string, MovementFiscalRecord>(
    (records ?? []).map((record) => [record.company_id, record])
  );

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    const base: Partial<MovementFiscalRecord> = current ?? {};
    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...fields
    } = base;
    saveMutation.mutate({
      company_id: companyId,
      mes_referencia: mes,
      ...fields,
      ...patch,
    } as unknown as MovementFiscalInput);
  };

  const handleMonthChange = (value: string) => {
    setMes(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // armazenamento indisponível — mantém apenas em memória
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Movimento Fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {FISCAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="mes-referencia">Mês de referência</Label>
        <Input
          id="mes-referencia"
          type="month"
          value={mes}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="mt-1.5"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Pode ser digitado ou escolhido. O último mês informado fica fixo
          (salvo neste dispositivo).
        </p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">N</TableHead>
                <TableHead className="w-14">UF</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Situação</TableHead>
                {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                  <TableHead key={field.key} className="whitespace-nowrap">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((company) => {
                  const record = recordByCompany.get(company.id);
                  const situacao = record?.situacao ?? "";
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {company.numero || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {company.uf}
                      </TableCell>
                      <TableCell className="max-w-36">
                        <span
                          className="block truncate font-medium"
                          title={company.name}
                        >
                          {company.name.length > 10
                            ? `${company.name.slice(0, 10)}…`
                            : company.name}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={situacao === "" ? "none" : situacao}
                          onValueChange={(value) =>
                            save(company.id, {
                              situacao: value === "none" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {SITUACAO_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                        <TableCell key={field.key}>
                          {field.type === "checkbox" ? (
                            <Checkbox
                              checked={record?.[field.key] === true}
                              onCheckedChange={(checked) =>
                                save(company.id, {
                                  [field.key]: checked === true,
                                })
                              }
                            />
                          ) : (
                            <Select
                              value={(record?.[field.key] as string) || "none"}
                              onValueChange={(value) =>
                                save(company.id, {
                                  [field.key]:
                                    value === "none" ? null : value,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-28">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Input
                          key={company.id}
                          defaultValue={record?.observacoes ?? ""}
                          onBlur={(event) =>
                            save(company.id, {
                              observacoes:
                                event.target.value.trim() || null,
                            })
                          }
                          className="h-8 min-w-40"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5 + MOVIMENTO_FISCAL_FIELDS.length}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma empresa vinculada ao departamento{" "}
                    {FISCAL_DEPARTMENT_NAME}. Marque esse departamento no
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
