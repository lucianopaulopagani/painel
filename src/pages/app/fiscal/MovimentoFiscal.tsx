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
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/context/auth";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  MOVIMENTO_FISCAL_FIELDS,
  SITUACAO_OPTIONS,
} from "@/lib/fiscal";
import type {
  CompanyWithDepartments,
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

const CELL = "px-1 py-1 text-[11px]";
const HEAD =
  "px-1 py-1.5 text-[11px] font-semibold text-foreground lowercase whitespace-nowrap";

export function MovimentoFiscal() {
  const { profile } = useAuth();
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || addMonths(currentMonth(), -1)
  );
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: users } = useUsers();
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

  const fiscalLinkOf = (company: CompanyWithDepartments) =>
    fiscal
      ? company.department_links.find((link) => link.department_id === fiscal.id)
      : undefined;

  const fiscalCompanies = (companies ?? []).filter((company) =>
    Boolean(fiscalLinkOf(company))
  );

  const responsibleIds = Array.from(
    new Set(
      fiscalCompanies.flatMap(
        (company) => fiscalLinkOf(company)?.profile_ids ?? []
      )
    )
  );
  const userNameById = new Map(
    (users ?? []).map((user) => [user.id, user.full_name])
  );

  const rows = fiscalCompanies
    .filter((company) => {
      const link = fiscalLinkOf(company);
      if (!link) return false;
      // Admin vê todas (com filtro por responsável); os demais veem apenas as
      // empresas em que são o responsável.
      if (isAdmin) {
        return (
          responsavelFiltro === "todos" ||
          link.profile_ids.includes(responsavelFiltro)
        );
      }
      return profile ? link.profile_ids.includes(profile.id) : false;
    })
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
    saveMutation.mutate(
      {
        company_id: companyId,
        mes_referencia: mes,
        ...fields,
        ...patch,
      } as unknown as MovementFiscalInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar o registro."
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

        {isAdmin && (
          <div className="max-w-xs">
            <Label>Responsável</Label>
            <Select
              value={responsavelFiltro}
              onValueChange={setResponsavelFiltro}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os responsáveis</SelectItem>
                {responsibleIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {userNameById.get(id) ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
                <TableHead className={`${HEAD} w-7`}>n</TableHead>
                <TableHead className={`${HEAD} w-8`}>uf</TableHead>
                <TableHead className={`${HEAD} w-28`}>empresa</TableHead>
                <TableHead className={`${HEAD} w-20`}>situação</TableHead>
                {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                  <TableHead
                    key={field.key}
                    className={`${HEAD} w-16`}
                    title={field.label}
                  >
                    {field.short}
                  </TableHead>
                ))}
                <TableHead className={`${HEAD} w-20`}>obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((company) => {
                  const record = recordByCompany.get(company.id);
                  const situacao = record?.situacao ?? "";
                  return (
                    <TableRow key={company.id}>
                      <TableCell className={`${CELL} whitespace-nowrap font-medium`}>
                        {company.numero || "—"}
                      </TableCell>
                      <TableCell className={`${CELL} whitespace-nowrap`}>
                        {company.uf}
                      </TableCell>
                      <TableCell className={CELL}>
                        <span
                          className="block truncate font-medium"
                          title={company.name}
                        >
                          {company.name}
                        </span>
                      </TableCell>
                      <TableCell className={`${CELL} whitespace-nowrap`}>
                        {!canEdit ? (
                          <span>{situacao || "—"}</span>
                        ) : (
                          <Select
                            value={situacao === "" ? "none" : situacao}
                            onValueChange={(value) =>
                              save(company.id, {
                                situacao: value === "none" ? null : value,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-full min-w-0 px-1 text-[11px]">
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
                        <TableCell key={field.key} className={CELL}>
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
                              <span className="block truncate">
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
                              key={`${company.id}:${mes}`}
                              defaultValue={
                                (record?.[field.key] as string) ?? ""
                              }
                              onBlur={(event) =>
                                save(company.id, {
                                  [field.key]:
                                    event.target.value.trim() || null,
                                })
                              }
                              className="h-7 w-full min-w-0 px-1 text-[11px]"
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
                              <SelectTrigger className="h-7 w-full min-w-0 px-1 text-[11px]">
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
                      <TableCell className={CELL}>
                        {!canEdit ? (
                          <span className="block truncate">
                            {record?.observacoes || "—"}
                          </span>
                        ) : (
                          <Input
                            key={`${company.id}:${mes}`}
                            defaultValue={record?.observacoes ?? ""}
                            title={record?.observacoes ?? ""}
                            onBlur={(event) =>
                              save(company.id, {
                                observacoes:
                                  event.target.value.trim() || null,
                              })
                            }
                            className="h-7 w-full min-w-0 px-1 text-[11px]"
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
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {isAdmin
                      ? `Nenhuma empresa vinculada ao departamento ${FISCAL_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`
                      : "Nenhuma empresa sob sua responsabilidade. Fale com o administrador para vincular as empresas a você no cadastro geral."}
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
