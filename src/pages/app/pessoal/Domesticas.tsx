import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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
import { Textarea } from "@/components/ui/textarea";
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
import type { DomesticasMovimentoInput, DomesticasMovimentoRecord } from "@/lib/types";

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

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";
const VHEAD = "sticky top-0 z-10 bg-muted";

/** Colunas de valor herdadas do mês anterior até serem alteradas. */
type PinnedKey = "data_base" | "senha";

/**
 * Domésticas — folha mensal das empresas marcadas com o subdepartamento
 * "Domésticas" no departamento Pessoal.
 *
 * N, Nome e CPF vêm do cadastro de empresas. Data Base e Senha ficam fixados
 * para os meses seguintes até serem alterados; o Status "Sem Movimento" joga a
 * empresa para a tabela "Sem movimento" abaixo da principal.
 */
export default function Domesticas() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    status: "",
    dataBase: "",
    numero: "",
    nome: "",
    cpf: "",
    senha: "",
    folha: "",
    dae: "",
    envio: "",
    ponto: "",
  });
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

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
    const match = (value: string | null | undefined, query: string): boolean =>
      !query ||
      (value ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR"));
    const matchDigits = (
      value: string | null | undefined,
      query: string
    ): boolean =>
      !query ||
      (value ?? "").replace(/\D/g, "").includes(query.replace(/\D/g, ""));
    const selectOrBlank = (
      value: string | null | undefined,
      query: string
    ): boolean => {
      if (query === "branco") return !value;
      return !query || (value ?? "") === query;
    };
    return (
      selectOrBlank(effectiveStatus(company.id), busca.status) &&
      selectOrBlank(effectivePinned(company.id, "data_base"), busca.dataBase) &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.nome) &&
      matchDigits(company.documento, busca.cpf) &&
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
  ) => {
    return (
      <Select
        value={value === "" ? "none" : value}
        onValueChange={(next) => {
          saveMutation.mutate({
            company_id: companyId,
            status: recordByCompany.get(companyId)?.status ?? null,
            data_base: effectivePinned(companyId, "data_base"),
            senha: effectivePinned(companyId, "senha"),
            [patchKey]: next === "none" ? null : next,
          } as unknown as DomesticasMovimentoInput);
        }}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
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
  };

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[],
    widthClass = "w-24"
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom ${VHEAD}`}>
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

  const renderFilterInput = (
    key: keyof typeof busca,
    label: string,
    widthClass = "w-24"
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom ${VHEAD}`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(event) => setBuscaField(key, event.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderRow = (company: (typeof rows)[number]) => {
    const record = recordByCompany.get(company.id);
    const senha = effectivePinned(company.id, "senha") ?? "";
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            effectiveStatus(company.id),
            DOMESTICAS_STATUS_OPTIONS,
            "status",
            PESSOAL_STATUS_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            effectivePinned(company.id, "data_base") ?? "",
            DOMESTICAS_MESES_OPTIONS,
            "data_base"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-12 whitespace-nowrap text-center font-medium`}>
          <CompanyNumber company={company} />
        </TableCell>
        <TableCell className={`${CELL} w-56`}>
          <span className="block truncate font-medium" title={company.name}>
            {company.name}
          </span>
        </TableCell>
        <TableCell className={`${CELL} w-32 whitespace-nowrap text-muted-foreground`}>
          {formatCpfCnpj(company.documento)}
        </TableCell>
        <TableCell className={`${CELL} w-40`}>
          <div className="flex items-center gap-1">
            <span
              className="block min-w-0 flex-1 truncate"
              title={senha}
            >
              {senha || "—"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              title="Definir a senha (fica fixada para os meses seguintes)"
              onClick={() => {
                setSenhaText(senha);
                setSenhaDialog({ companyId: company.id, nome: company.name });
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.folha ?? "",
            DOMESTICAS_FOLHA_OPTIONS,
            "folha",
            PESSOAL_FLAG_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.dae ?? "",
            DOMESTICAS_DAE_OPTIONS,
            "dae",
            PESSOAL_FLAG_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.envio ?? "",
            DOMESTICAS_ENVIO_OPTIONS,
            "envio",
            PESSOAL_ENVIO_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.ponto ?? "",
            DOMESTICAS_PONTO_OPTIONS,
            "ponto",
            PESSOAL_ENVIO_TONE
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (
    data: typeof rows,
    emptyMessage: string
  ) => (
    <Table className="table-fixed min-w-[1180px]">
      <TableHeader>
        <TableRow className="bg-muted hover:bg-muted">
          {renderFilterSelect("status", "Status", DOMESTICAS_STATUS_OPTIONS, "w-28")}
          {renderFilterSelect("dataBase", "Data Base", DOMESTICAS_MESES_OPTIONS)}
          {renderFilterInput("numero", "N", "w-12")}
          {renderFilterInput("nome", "Nome", "w-56")}
          {renderFilterInput("cpf", "CPF", "w-32")}
          {renderFilterInput("senha", "Senha", "w-40")}
          {renderFilterSelect("folha", "Folha", DOMESTICAS_FOLHA_OPTIONS)}
          {renderFilterSelect("dae", "DAE", DOMESTICAS_DAE_OPTIONS)}
          {renderFilterSelect("envio", "Envio", DOMESTICAS_ENVIO_OPTIONS)}
          {renderFilterSelect("ponto", "Ponto", DOMESTICAS_PONTO_OPTIONS)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map(renderRow)
        ) : (
          <TableRow>
            <TableCell
              colSpan={10}
              className={`${CELL} py-6 text-center text-muted-foreground`}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Domésticas</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME} marcadas
          com o subdepartamento {SUBMENU}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="dom-mes">Mês de referência</Label>
        <Input
          id="dom-mes"
          type="month"
          value={mes}
          onChange={(event) => handleMonthChange(event.target.value)}
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
        <>
          <div className="overflow-x-auto rounded-lg border">
            {renderTable(
              movimentadas,
              Object.values(busca).some(Boolean) && rows.length > 0
                ? "Nenhuma empresa encontrada com os filtros."
                : `Nenhuma empresa marcada com o subdepartamento ${SUBMENU}. Marque esse subdepartamento no cadastro de empresas (departamento ${PESSOAL_DEPARTMENT_NAME}) para que elas apareçam aqui.`
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-semibold">
              {DOMESTICAS_SEM_MOVIMENTO} ({semMovimento.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              {renderTable(
                semMovimento,
                "Nenhuma empresa sem movimento neste mês."
              )}
            </div>
          </div>
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
