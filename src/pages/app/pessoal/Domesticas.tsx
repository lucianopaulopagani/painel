import { useState } from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import {
  useAllDomesticasMovimento,
  useDomesticasMovimento,
  useSaveDomesticasMovimento,
} from "@/hooks/use-domesticas-movimento";
import {
  DOMESTICAS_DAE_OPTIONS,
  DOMESTICAS_ENVIO_OPTIONS,
  DOMESTICAS_FOLHA_OPTIONS,
  DOMESTICAS_MESES_OPTIONS,
  DOMESTICAS_PONTO_OPTIONS,
  DOMESTICAS_SEM_MOVIMENTO,
  DOMESTICAS_STATUS_OPTIONS,
} from "@/lib/domesticas";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyInSubmenuInMonth } from "@/lib/department-submenus";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import {
  PESSOAL_ENVIO_TONE,
  PESSOAL_FLAG_TONE,
  PESSOAL_STATUS_TONE,
} from "@/lib/pessoal-tones";
import { CompanyNumber } from "@/components/company-number";
import { cn, formatCpfCnpj } from "@/lib/utils";
import type {
  CompanyWithDepartments,
  DomesticasMovimentoInput,
  DomesticasMovimentoRecord,
} from "@/lib/types";

const STORAGE_KEY = "pessoal:domesticas-mes";

/** Subdepartamento que define as empresas do módulo. */
const SUBMENU = "Domésticas";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

/** Colunas de valor herdadas do mês anterior até serem alteradas. */
type PinnedKey = "data_base" | "senha";

const SELECT_TRIGGER =
  "h-9 w-full min-w-0 rounded-lg px-2 text-xs font-semibold shadow-sm";

/**
 * Domésticas — folha mensal das empresas marcadas com o subdepartamento
 * "Domésticas" no departamento Pessoal, em cartões (sem grade estilo planilha).
 *
 * N, Nome e CPF vêm do cadastro de empresas. Data Base e Senha ficam fixados
 * para os meses seguintes até serem alterados; o Status "Sem Movimento" leva a
 * empresa para a seção "Sem movimento" abaixo da lista principal.
 */
export default function Domesticas() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    q: "",
    status: "",
    dataBase: "",
    senha: "",
    folha: "",
    dae: "",
    envio: "",
    ponto: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [senhaDialog, setSenhaDialog] = useState<{
    companyId: string;
    nome: string;
  } | null>(null);
  const [senhaText, setSenhaText] = useState("");

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useDomesticasMovimento(mes);
  const { data: allRecords } = useAllDomesticasMovimento();
  const saveMutation = useSaveDomesticasMovimento(mes);

  const pessoal = findDepartmentByName(departments, PESSOAL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter((company) =>
      companyInSubmenuInMonth(company, pessoal?.id, SUBMENU, mes)
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map<string, DomesticasMovimentoRecord>(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /** Histórico anterior ao mês exibido, do mais recente para o mais antigo. */
  const priorRecords = (companyId: string) =>
    (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));

  /**
   * Data Base e Senha: valor do mês; sem registro no mês, herda do mês anterior
   * mais recente (fica fixado para os meses seguintes até ser alterado).
   */
  const effectivePinned = (
    companyId: string,
    key: PinnedKey
  ): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current[key];
    return priorRecords(companyId)[0]?.[key] ?? null;
  };

  /**
   * Status: valor do mês; sem registro, mantém "Sem Movimento" do mês anterior
   * mais recente (a empresa segue fora do movimento até ser alterada).
   */
  const effectiveStatus = (companyId: string): string => {
    const current = recordByCompany.get(companyId);
    if (current) return current.status ?? "";
    return priorRecords(companyId)[0]?.status === DOMESTICAS_SEM_MOVIMENTO
      ? DOMESTICAS_SEM_MOVIMENTO
      : "";
  };

  const query = busca.q.trim().toLocaleLowerCase("pt-BR");
  const queryDigits = query.replace(/\D/g, "");

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
    // Busca livre: nº, nome ou CPF (qualquer um deles).
    const matchesSearch =
      !query ||
      match(company.numero, query) ||
      match(company.name, query) ||
      (queryDigits.length > 0 &&
        match(
          (company.documento ?? "").replace(/\D/g, ""),
          queryDigits
        ));
    return (
      matchesSearch &&
      selectOrBlank(effectiveStatus(company.id), busca.status) &&
      selectOrBlank(effectivePinned(company.id, "data_base"), busca.dataBase) &&
      match(effectivePinned(company.id, "senha"), busca.senha) &&
      selectOrBlank(record?.folha, busca.folha) &&
      selectOrBlank(record?.dae, busca.dae) &&
      selectOrBlank(record?.envio, busca.envio) &&
      selectOrBlank(record?.ponto, busca.ponto)
    );
  });

  const movimentadas = filteredRows.filter(
    (company) => effectiveStatus(company.id) !== DOMESTICAS_SEM_MOVIMENTO
  );
  const semMovimento = filteredRows.filter(
    (company) => effectiveStatus(company.id) === DOMESTICAS_SEM_MOVIMENTO
  );

  const activeFilters = [
    busca.status,
    busca.dataBase,
    busca.senha,
    busca.folha,
    busca.dae,
    busca.envio,
    busca.ponto,
  ].filter(Boolean).length;

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const record = recordByCompany.get(companyId);
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...fields } =
      record ?? {};
    saveMutation.mutate(
      {
        company_id: companyId,
        status: record?.status ?? null,
        data_base: effectivePinned(companyId, "data_base"),
        senha: effectivePinned(companyId, "senha"),
        ...fields,
        ...patch,
      } as unknown as DomesticasMovimentoInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  /** Marcação mensal: lista suspensa em pílula com a cor do módulo. */
  const renderFieldSelect = (
    companyId: string,
    label: string,
    value: string,
    options: readonly string[],
    patchKey: string,
    toneClass: Record<string, string>
  ) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Select
        value={value === "" ? "none" : value}
        onValueChange={(next) =>
          save(companyId, { [patchKey]: next === "none" ? null : next })
        }
      >
        <SelectTrigger
          className={cn(SELECT_TRIGGER, toneClass[value])}
          aria-label={`${label} — ${value || "em branco"}`}
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
    </div>
  );

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[]
  ) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Select
        value={busca[key] === "" ? "todos" : busca[key]}
        onValueChange={(value) =>
          setBuscaField(key, value === "todos" ? "" : value)
        }
      >
        <SelectTrigger className="h-9 w-full min-w-0 px-2 text-xs">
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
    </div>
  );

  const renderCard = (company: CompanyWithDepartments) => {
    const record = recordByCompany.get(company.id);
    const status = effectiveStatus(company.id);
    const dataBase = effectivePinned(company.id, "data_base") ?? "";
    const senha = effectivePinned(company.id, "senha") ?? "";

    return (
      <div
        key={company.id}
        className="flex flex-col rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <CompanyNumber company={company} />
              <span className="truncate font-medium" title={company.name}>
                {company.name}
              </span>
            </span>
            <span className="mt-0.5 truncate text-xs text-muted-foreground">
              {formatCpfCnpj(company.documento)}
            </span>
          </div>

          <Select
            value={status === "" ? "none" : status}
            onValueChange={(next) =>
              save(company.id, { status: next === "none" ? null : next })
            }
          >
            <SelectTrigger
              className={cn(
                "h-8 w-auto max-w-[10rem] gap-1 rounded-full border-0 px-3 text-xs font-semibold shadow-sm",
                PESSOAL_STATUS_TONE[status]
              )}
              title="Status do mês"
            >
              <SelectValue placeholder="Sem status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {DOMESTICAS_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {renderFieldSelect(
            company.id,
            "Data Base",
            dataBase,
            DOMESTICAS_MESES_OPTIONS,
            "data_base",
            {}
          )}
          {renderFieldSelect(
            company.id,
            "Folha",
            record?.folha ?? "",
            DOMESTICAS_FOLHA_OPTIONS,
            "folha",
            PESSOAL_FLAG_TONE
          )}
          {renderFieldSelect(
            company.id,
            "DAE",
            record?.dae ?? "",
            DOMESTICAS_DAE_OPTIONS,
            "dae",
            PESSOAL_FLAG_TONE
          )}
          {renderFieldSelect(
            company.id,
            "Envio",
            record?.envio ?? "",
            DOMESTICAS_ENVIO_OPTIONS,
            "envio",
            PESSOAL_ENVIO_TONE
          )}
          {renderFieldSelect(
            company.id,
            "Ponto",
            record?.ponto ?? "",
            DOMESTICAS_PONTO_OPTIONS,
            "ponto",
            PESSOAL_ENVIO_TONE
          )}
          <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </span>
              <p className="truncate text-xs font-medium" title={senha}>
                {senha || "—"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Ações — definir a senha (fica fixada para os meses seguintes)"
              onClick={() => {
                setSenhaText(senha);
                setSenhaDialog({ companyId: company.id, nome: company.name });
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Domésticas</h2>
          <p className="text-sm text-muted-foreground">
            Empresas do departamento {PESSOAL_DEPARTMENT_NAME} marcadas com o
            subdepartamento {SUBMENU}.
          </p>
        </div>
        <div className="w-full sm:w-44">
          <Label
            htmlFor="dom-mes"
            className="text-xs font-medium text-muted-foreground"
          >
            Mês de referência
          </Label>
          <Input
            id="dom-mes"
            type="month"
            value={mes}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="mt-1.5 h-9 rounded-lg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca.q}
              onChange={(event) => setBuscaField("q", event.target.value)}
              placeholder="Buscar por nº, nome ou CPF"
              className="h-9 rounded-lg pl-9"
            />
          </div>
          <Button
            type="button"
            variant={filtersOpen ? "secondary" : "outline"}
            className="h-9 gap-2 rounded-lg"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] tabular-nums"
              >
                {activeFilters}
              </Badge>
            )}
          </Button>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {movimentadas.length} em movimento
            {semMovimento.length > 0 && ` · ${semMovimento.length} sem`}
          </span>
        </div>

        {filtersOpen && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {renderFilterSelect("status", "Status", DOMESTICAS_STATUS_OPTIONS)}
              {renderFilterSelect(
                "dataBase",
                "Data Base",
                DOMESTICAS_MESES_OPTIONS
              )}
              {renderFilterSelect("folha", "Folha", DOMESTICAS_FOLHA_OPTIONS)}
              {renderFilterSelect("dae", "DAE", DOMESTICAS_DAE_OPTIONS)}
              {renderFilterSelect("envio", "Envio", DOMESTICAS_ENVIO_OPTIONS)}
              {renderFilterSelect("ponto", "Ponto", DOMESTICAS_PONTO_OPTIONS)}
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-3 lg:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Senha
                </span>
                <Input
                  value={busca.senha}
                  onChange={(event) =>
                    setBuscaField("senha", event.target.value)
                  }
                  placeholder="Filtrar"
                  className="h-9 rounded-lg"
                />
              </div>
              {(activeFilters > 0 || busca.q !== "") && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg text-xs"
                    onClick={() =>
                      setBusca({
                        q: "",
                        status: "",
                        dataBase: "",
                        senha: "",
                        folha: "",
                        dae: "",
                        envio: "",
                        ponto: "",
                      })
                    }
                  >
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as empresas.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa marcada com o subdepartamento {SUBMENU}. Marque
                esse subdepartamento no cadastro de empresas (departamento{" "}
                {PESSOAL_DEPARTMENT_NAME}) para que elas apareçam aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {movimentadas.map(renderCard)}
              </div>

              {movimentadas.length === 0 && (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Nenhuma empresa encontrada com os filtros.
                </p>
              )}

              <section className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {DOMESTICAS_SEM_MOVIMENTO}
                  </h3>
                  <Badge variant="secondary" className="tabular-nums">
                    {semMovimento.length}
                  </Badge>
                </div>
                {semMovimento.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    {semMovimento.map(renderCard)}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Nenhuma empresa sem movimento neste mês.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}

      <Dialog
        open={senhaDialog !== null}
        onOpenChange={(open) => {
          if (!open) setSenhaDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Senha</DialogTitle>
            <DialogDescription>
              {senhaDialog?.nome} — {mes}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={senhaText}
            onChange={(event) => setSenhaText(event.target.value)}
            placeholder="Escreva a senha desta empresa"
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSenhaDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!senhaDialog) return;
                save(senhaDialog.companyId, {
                  senha: senhaText.trim() || null,
                });
                setSenhaDialog(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
