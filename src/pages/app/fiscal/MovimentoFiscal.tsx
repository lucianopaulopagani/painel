import { useState } from "react";
import { Check, FilePlus2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  useGenerateMovimentoFiscal,
  useLatestMovimentoFiscal,
  useMovimentoFiscal,
  useMovimentoFiscalMonthExists,
  useSaveMovimentoFiscal,
} from "@/hooks/use-movimento-fiscal";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { useAuth } from "@/context/auth";
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

function addMonths(mes: string, amount: number): string {
  const [year, month] = mes.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split("-");
  return `${month}/${year}`;
}

function readStoredMonth(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function MovimentoFiscal() {
  const { profile } = useAuth();
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || addMonths(currentMonth(), -1)
  );

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useMovimentoFiscal(mes);
  const saveMutation = useSaveMovimentoFiscal(mes);
  const { data: latestRecords } = useLatestMovimentoFiscal();
  // O "mês atual" (referência de trabalho) é sempre o mês anterior ao mês em
  // curso; o mês em curso é gerado/liberado pelo administrador.
  const mesEmCurso = currentMonth();
  const mesAtual = addMonths(mesEmCurso, -1);
  const mesSeguinte = mesEmCurso;
  const { data: nextMonthExists } = useMovimentoFiscalMonthExists(mesSeguinte);
  const generateMutation = useGenerateMovimentoFiscal(mesSeguinte);

  const isAdmin = profile?.role === "admin";
  // Usuários editam meses até a referência (anterior ao mês em curso) e o
  // mês em curso depois que ele é liberado pelo administrador.
  const canEdit =
    isAdmin ||
    mes <= mesAtual ||
    (mes === mesSeguinte && !!nextMonthExists);

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

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        companyIds: rows.map((company) => company.id),
        sourceRecords: latestRecords ?? [],
      });
      toast.success(`Mês ${formatMonthLabel(mesSeguinte)} gerado e liberado.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao gerar o próximo mês."
      );
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

      <div className="max-w-md space-y-3">
        <div>
          <Label htmlFor="mes-referencia">Mês de referência</Label>
          <Input
            id="mes-referencia"
            type="month"
            value={mes}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mes === mesAtual ? "secondary" : "outline"}
            onClick={() => handleMonthChange(mesAtual)}
          >
            Atual ({formatMonthLabel(mesAtual)})
          </Button>
          {(isAdmin || nextMonthExists) && (
            <Button
              type="button"
              size="sm"
              variant={mes === mesSeguinte ? "secondary" : "outline"}
              onClick={() => handleMonthChange(mesSeguinte)}
            >
              Próximo ({formatMonthLabel(mesSeguinte)})
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!!nextMonthExists}
                >
                  <FilePlus2 className="h-4 w-4" />
                  {nextMonthExists
                    ? `Próximo mês liberado (${formatMonthLabel(mesSeguinte)})`
                    : `Gerar e liberar próximo mês (${formatMonthLabel(mesSeguinte)})`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Gerar e liberar {formatMonthLabel(mesSeguinte)}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Serão criados os registros do próximo mês para todas as
                    empresas do departamento {FISCAL_DEPARTMENT_NAME}, com as
                    marcações em branco e as observações copiadas do mês mais
                    recente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    Gerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          O mês atual é sempre a referência anterior ao mês em curso.
          Marcações são individuais por mês. O mês em curso é liberado pelo
          administrador; depois de liberado, os usuários podem editá-lo.
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
                        {!canEdit ? (
                          <span className="text-sm">{situacao || "—"}</span>
                        ) : (
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
                        )}
                      </TableCell>
                      {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                        <TableCell key={field.key}>
                          {!canEdit ? (
                            field.type === "checkbox" ? (
                              record?.[field.key] === true ? (
                                <Check className="h-4 w-4 text-status-success" />
                              ) : (
                                <span className="text-muted-foreground">
                                  —
                                </span>
                              )
                            ) : (
                              <span className="text-sm">
                                {(record?.[field.key] as string) || "—"}
                              </span>
                            )
                          ) : field.type === "checkbox" ? (
                            <Checkbox
                              checked={record?.[field.key] === true}
                              onCheckedChange={(checked) =>
                                save(company.id, {
                                  [field.key]: checked === true,
                                })
                              }
                            />
                          ) : field.type === "input" ? (
                            <Input
                              key={company.id}
                              defaultValue={
                                (record?.[field.key] as string) ?? ""
                              }
                              onBlur={(event) =>
                                save(company.id, {
                                  [field.key]:
                                    event.target.value.trim() || null,
                                })
                              }
                              className="h-8 w-20"
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
                        {!canEdit ? (
                          <span className="text-sm text-muted-foreground">
                            {record?.observacoes || "—"}
                          </span>
                        ) : (
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
                        )}
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
