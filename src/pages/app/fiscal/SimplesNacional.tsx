import { Fragment, useState } from "react";
import { Banknote, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  useAllMovimentoFiscal,
  useMovimentoFiscal,
  useSaveMovimentoFiscal,
} from "@/hooks/use-movimento-fiscal";
import {
  MOVIMENTO_FISCAL_FIELDS,
  SITUACAO_OPTIONS,
  isSituacaoFinalizada,
} from "@/lib/fiscal";
import { CompanyNumber } from "@/components/company-number";
import {
  currencyToStorage,
  formatCurrencyField,
  maskCurrencyInput,
} from "@/lib/currency";
import {
  useFieldOptions,
  useFieldTone,
  useStatusOptions,
  useStatusTone,
} from "@/hooks/use-tributacao-status";
import { cn, formatCpfCnpj } from "@/lib/utils";
import type {
  CompanyWithDepartments,
  MovementFiscalInput,
  MovementFiscalRecord,
} from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Tributação desta subtabela. */
export const SIMPLES_NACIONAL_TRIBUTACAO = "Simples Nacional";

/** Campos preenchidos em reais (editados juntos no diálogo de Ações). */
const MONEY_FIELDS = MOVIMENTO_FISCAL_FIELDS.filter(
  (field) => field.type === "input"
);

/** A coluna Observações fica logo após este campo. */
const OBS_AFTER_FIELD = "dif_aliq_st";

/**
 * Rótulos das opções de alguns campos (valor gravado → texto exibido). O DAS
 * grava "OK-SM" e aparece como "SM" na tabela e no filtro.
 */
const OPTION_LABELS: Record<string, Record<string, string>> = {
  das: { "OK-SM": "SM" },
};

const optionLabel = (key: string, value: string): string =>
  OPTION_LABELS[key]?.[value] ?? value;

const TONE: Record<string, string> = {
  OK: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  "OK-SM":
    "bg-status-info text-status-info-foreground hover:bg-status-info/90",
  "OK-ENT":
    "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
  FAZENDO:
    "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
};

interface SimplesNacionalTableProps {
  /** Mês de referência do Movimento Fiscal. */
  mes: string;
  /**
   * Empresas já filtradas pelo Movimento Fiscal (departamento Fiscal, filtro de
   * Responsável e mês). A subtabela apenas separa as de Simples Nacional.
   */
  companies: CompanyWithDepartments[];
}

/**
 * Subtabela do Simples Nacional — exibida dentro do Movimento Fiscal quando a
 * tributação "Simples Nacional" é selecionada. As demais tributações seguem na
 * tabela padrão até ganharem suas próprias tabelas.
 */
export function SimplesNacionalTable({
  mes,
  companies,
}: SimplesNacionalTableProps) {
  const [busca, setBusca] = useState<Record<string, string>>({
    numero: "",
    empresa: "",
    uf: "",
    cnpj: "",
    ie: "",
    situacao: "",
    observacoes: "",
    ...Object.fromEntries(
      MOVIMENTO_FISCAL_FIELDS.map((field) => [field.key, ""])
    ),
  });
  /* Diálogo dos valores em R$ (um botão de Ações para os quatro campos). */
  const [moneyDialog, setMoneyDialog] = useState<{
    companyId: string;
    empresa: string;
    numero: string;
  } | null>(null);
  const [moneyValues, setMoneyValues] = useState<Record<string, string>>({});
  /* Diálogo das observações (texto). */
  const [obsDialog, setObsDialog] = useState<{
    companyId: string;
    empresa: string;
    numero: string;
  } | null>(null);
  const [obsText, setObsText] = useState("");

  const setBuscaField = (key: string, value: string) =>
    setBusca((prev) => ({ ...prev, [key]: value }));

  /** Status cadastrados para esta tributação (com fallback). */
  const resolveStatusOptions = useStatusOptions();
  const resolveStatusTone = useStatusTone();
  const resolveFieldOptions = useFieldOptions();
  const resolveFieldTone = useFieldTone();
  const situacaoOptions = resolveStatusOptions(
    SIMPLES_NACIONAL_TRIBUTACAO,
    SITUACAO_OPTIONS
  );

  const { data: records } = useMovimentoFiscal(mes);
  const { data: allRecords } = useAllMovimentoFiscal();
  const saveMutation = useSaveMovimentoFiscal(mes);

  const rows = companies
    .filter((company) => company.tributacao === SIMPLES_NACIONAL_TRIBUTACAO)
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map<string, MovementFiscalRecord>(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /** Observação efetiva (herdada do mês anterior mais recente). */
  const effectiveObservacoes = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current && current.observacoes) return current.observacoes;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior.find((record) => record.observacoes)?.observacoes ?? null;
  };

  const ufOptions = Array.from(
    new Set(
      rows.map((company) => company.uf).filter((uf): uf is string => Boolean(uf))
    )
  ).sort();

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
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      selectOrBlank(company.uf, busca.uf) &&
      matchDigits(company.documento, busca.cnpj) &&
      match(company.inscricao_estadual, busca.ie) &&
      selectOrBlank(record?.situacao, busca.situacao) &&
      MOVIMENTO_FISCAL_FIELDS.every((field) =>
        field.type === "checkbox"
          ? true
          : selectOrBlank(record?.[field.key] as string | null, busca[field.key])
      ) &&
      match(effectiveObservacoes(company.id), busca.observacoes)
    );
  });

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    const base = current ?? {};
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
      observacoes: effectiveObservacoes(companyId) ?? null,
      ...patch,
    } as unknown as MovementFiscalInput);
  };

  /** Abre o diálogo de Ações com os valores em R$ da empresa. */
  const openMoneyDialog = (
    company: CompanyWithDepartments,
    record?: MovementFiscalRecord
  ) => {
    setMoneyValues(
      Object.fromEntries(
        MONEY_FIELDS.map((field) => [
          field.key,
          formatCurrencyField(
            (record?.[field.key] as string | null | undefined) ?? ""
          ),
        ])
      )
    );
    setMoneyDialog({
      companyId: company.id,
      empresa: company.name,
      numero: company.numero ?? "",
    });
  };

  /** Grava os quatro valores em R$ de uma vez. */
  const saveMoneyValues = () => {
    if (!moneyDialog) return;
    save(
      moneyDialog.companyId,
      Object.fromEntries(
        MONEY_FIELDS.map((field) => [
          field.key,
          currencyToStorage(moneyValues[field.key] ?? ""),
        ])
      )
    );
    setMoneyDialog(null);
  };

  const renderSelectCell = (
    companyId: string,
    value: string,
    options: readonly string[],
    patchKey: string,
    toneOverride?: string
  ) => {
    return (
    <Select
      value={value === "" ? "none" : value}
      onValueChange={(next) => {
        save(companyId, { [patchKey]: next === "none" ? null : next });
      }}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
          toneOverride ?? TONE[value]
        )}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {optionLabel(patchKey, option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    );
  };

  const renderFilterInput = (key: string, label: string, widthClass = "") => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key] ?? ""}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderFilterSelect = (
    key: string,
    label: string,
    options: readonly string[],
    widthClass = "w-16"
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
              {optionLabel(key, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Simples Nacional — empresas com tributação {SIMPLES_NACIONAL_TRIBUTACAO}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[1232px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {renderFilterInput("numero", "Nº", "w-10")}
              {renderFilterSelect("uf", "UF", ufOptions, "w-16")}
              {renderFilterInput("empresa", "Empresa", "w-36")}
              {renderFilterInput("cnpj", "CNPJ", "w-24")}
              {renderFilterInput("ie", "Insc. Estadual", "w-20")}
              {renderFilterSelect("situacao", "Status", situacaoOptions, "w-20")}
              {MOVIMENTO_FISCAL_FIELDS.map((field) => {
                const head =
                  field.type === "checkbox" ? (
                    <TableHead
                      className={`${HEAD} w-12 text-center align-bottom`}
                    >
                      <span className="mb-1 block whitespace-nowrap">
                        {field.short}
                      </span>
                    </TableHead>
                  ) : field.type === "select" ? (
                    renderFilterSelect(
                      field.key,
                      field.short,
                      resolveFieldOptions(
                        SIMPLES_NACIONAL_TRIBUTACAO,
                        field.key,
                        field.options ?? []
                      ),
                      "w-16"
                    )
                  ) : (
                    renderFilterInput(field.key, field.short, "w-20")
                  );
                return (
                  <Fragment key={field.key}>
                    {head}
                    {field.key === OBS_AFTER_FIELD && (
                      <Fragment>
                        {renderFilterInput(
                          "observacoes",
                          "Observações",
                          "w-28"
                        )}
                        <TableHead
                          className={`${HEAD} w-14 text-center align-bottom`}
                        >
                          <span className="mb-1 block whitespace-nowrap">
                            Ações
                          </span>
                        </TableHead>
                      </Fragment>
                    )}
                  </Fragment>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const record = recordByCompany.get(company.id);
              return (
                <TableRow
                  key={company.id}
                >
                  <TableCell
                    className={`${CELL} whitespace-nowrap text-center font-medium`}
                  >
                    <CompanyNumber company={company} />
                  </TableCell>
                  <TableCell
                    className={`${CELL} w-16 whitespace-nowrap`}
                  >
                    {company.uf || "—"}
                  </TableCell>
                  <TableCell className={CELL}>
                    <span
                      className="block truncate font-medium"
                      title={company.name}
                    >
                      {company.name}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`${CELL} w-24 whitespace-nowrap text-muted-foreground`}
                  >
                    {formatCpfCnpj(company.documento)}
                  </TableCell>
                  <TableCell
                    className={`${CELL} w-20 truncate`}
                    title={company.inscricao_estadual ?? undefined}
                  >
                    {company.inscricao_estadual || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} w-20`}>
                    {renderSelectCell(
                      company.id,
                      record?.situacao ?? "",
                      situacaoOptions,
                      "situacao",
                      resolveStatusTone(
                        SIMPLES_NACIONAL_TRIBUTACAO,
                        record?.situacao ?? ""
                      ) ?? TONE[record?.situacao ?? ""]
                    )}
                  </TableCell>
                  {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                    <Fragment key={field.key}>
                      <TableCell
                        className={`${CELL} ${
                          field.type === "checkbox"
                            ? "w-12 text-center"
                            : field.type === "select"
                              ? "w-16"
                              : "w-20"
                        }`}
                      >
                        {field.type === "checkbox" ? (
                          <Checkbox
                            checked={record?.[field.key] === true}
                            onCheckedChange={(checked) => {
                              save(company.id, {
                                [field.key]: checked === true,
                              });
                            }}
                          />
                        ) : field.type === "input" ? (
                          <span
                            className="block truncate text-right tabular-nums"
                            title={formatCurrencyField(
                              (record?.[field.key] as string) ?? ""
                            )}
                          >
                            {formatCurrencyField(
                              (record?.[field.key] as string) ?? ""
                            ) || "—"}
                          </span>
                        ) : (
                          renderSelectCell(
                            company.id,
                            (record?.[field.key] as string) ?? "",
                            field.options ?? [],
                            field.key
                          )
                        )}
                      </TableCell>
                      {field.key === OBS_AFTER_FIELD && (
                        <Fragment>
                          <TableCell className={`${CELL} w-28`}>
                            <span
                              className="block truncate"
                              title={effectiveObservacoes(company.id) ?? ""}
                            >
                              {effectiveObservacoes(company.id) || "—"}
                            </span>
                          </TableCell>
                          <TableCell className={`${CELL} w-14`}>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                title="Ações — valores (R$)"
                                onClick={() => openMoneyDialog(company, record)}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                title="Ações — observações"
                                onClick={() => {
                                  setObsText(
                                    effectiveObservacoes(company.id) ?? ""
                                  );
                                  setObsDialog({
                                    companyId: company.id,
                                    empresa: company.name,
                                    numero: company.numero ?? "",
                                  });
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </Fragment>
                      )}
                    </Fragment>
                  ))}
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={17}
                  className={`${CELL} py-8 text-center text-muted-foreground`}
                >
                  {rows.length > 0
                    ? "Nenhuma empresa encontrada com os filtros."
                    : `Nenhuma empresa com tributação ${SIMPLES_NACIONAL_TRIBUTACAO}. Defina essa tributação no cadastro de empresas para que ela apareça aqui.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={moneyDialog !== null}
        onOpenChange={(open) => {
          if (!open) setMoneyDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Valores (R$)</DialogTitle>
            <DialogDescription>
              {moneyDialog?.numero ? `${moneyDialog.numero} — ` : ""}
              {moneyDialog?.empresa} — {mes}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MONEY_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`money-${field.key}`}
                  className="text-xs text-muted-foreground"
                >
                  {field.label}
                </Label>
                <Input
                  id={`money-${field.key}`}
                  inputMode="numeric"
                  value={moneyValues[field.key] ?? ""}
                  onChange={(event) =>
                    setMoneyValues((prev) => ({
                      ...prev,
                      [field.key]: maskCurrencyInput(event.target.value),
                    }))
                  }
                  placeholder="R$ 0,00"
                  className="text-right tabular-nums"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Digite apenas os números: os centavos são preenchidos
            automaticamente (ex.: 123456 → R$ 1.234,56).
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoneyDialog(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={saveMoneyValues}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={obsDialog !== null}
        onOpenChange={(open) => {
          if (!open) setObsDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Observações</DialogTitle>
            <DialogDescription>
              {obsDialog?.numero ? `${obsDialog.numero} — ` : ""}
              {obsDialog?.empresa} — {mes}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={obsText}
            onChange={(event) => setObsText(event.target.value)}
            placeholder="Escreva a observação desta empresa"
            rows={5}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            A observação é levada para os meses seguintes até ser alterada.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setObsDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!obsDialog) return;
                save(obsDialog.companyId, {
                  observacoes: obsText.trim() || null,
                });
                setObsDialog(null);
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

export default SimplesNacionalTable;
