import { useState } from "react";
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
import { DATA_INICIO_BLOCK_TITLE, isPeriodBeforeStart } from "@/lib/companies";
import {
  MOVIMENTO_FISCAL_FIELDS,
  SITUACAO_OPTIONS,
  isSituacaoFinalizada,
} from "@/lib/fiscal";
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

const TONE: Record<string, string> = {
  OK: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  "OK-SM":
    "bg-status-success text-status-success-foreground hover:bg-status-success/90",
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

  const setBuscaField = (key: string, value: string) =>
    setBusca((prev) => ({ ...prev, [key]: value }));

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

  /** Empresas bloqueadas no mês exibido (anterior à Data de Início). */
  const startBlockedIds = new Set(
    rows
      .filter((company) => isPeriodBeforeStart(company, mes))
      .map((company) => company.id)
  );

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

  const renderSelectCell = (
    companyId: string,
    value: string,
    options: readonly string[],
    patchKey: string
  ) => {
    // Períodos anteriores à Data de Início da empresa ficam bloqueados.
    const blocked = startBlockedIds.has(companyId);
    return (
    <Select
      value={value === "" ? "none" : value}
      disabled={blocked}
      onValueChange={(next) => {
        if (blocked) return;
        save(companyId, { [patchKey]: next === "none" ? null : next });
      }}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
          TONE[value]
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
              {option}
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
              {renderFilterSelect("situacao", "Situação", SITUACAO_OPTIONS, "w-20")}
              {MOVIMENTO_FISCAL_FIELDS.map((field) =>
                field.type === "checkbox" ? (
                  <TableHead
                    key={field.key}
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
                    field.options ?? [],
                    "w-16"
                  )
                ) : (
                  renderFilterInput(field.key, field.short, "w-20")
                )
              )}
              {renderFilterInput("observacoes", "Observações", "w-32")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const record = recordByCompany.get(company.id);
              const blocked = startBlockedIds.has(company.id);
              return (
                <TableRow
                  key={company.id}
                  title={blocked ? DATA_INICIO_BLOCK_TITLE : undefined}
                >
                  <TableCell
                    className={`${CELL} whitespace-nowrap text-center font-medium`}
                  >
                    {company.numero || "—"}
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
                      SITUACAO_OPTIONS,
                      "situacao"
                    )}
                  </TableCell>
                  {MOVIMENTO_FISCAL_FIELDS.map((field) => (
                    <TableCell
                      key={field.key}
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
                          disabled={blocked}
                          onCheckedChange={(checked) => {
                            if (blocked) return;
                            save(company.id, {
                              [field.key]: checked === true,
                            });
                          }}
                        />
                      ) : field.type === "input" ? (
                        <Input
                          key={`${company.id}:${mes}:${field.key}`}
                          defaultValue={
                            (record?.[field.key] as string) ?? ""
                          }
                          disabled={blocked}
                          onBlur={(event) =>
                            save(company.id, {
                              [field.key]: event.target.value.trim() || null,
                            })
                          }
                          className="h-7 w-full min-w-0 px-1 text-[11px]"
                        />
                      ) : (
                        renderSelectCell(
                          company.id,
                          (record?.[field.key] as string) ?? "",
                          field.options ?? [],
                          field.key
                        )
                      )}
                    </TableCell>
                  ))}
                  <TableCell className={`${CELL} w-32`}>
                    <Input
                      key={`${company.id}:${mes}:obs`}
                      defaultValue={effectiveObservacoes(company.id) ?? ""}
                      disabled={blocked}
                      title={
                        blocked
                          ? DATA_INICIO_BLOCK_TITLE
                          : (effectiveObservacoes(company.id) ?? "")
                      }
                      onBlur={(event) =>
                        save(company.id, {
                          observacoes: event.target.value.trim() || null,
                        })
                      }
                      className="h-7 w-full min-w-0 px-1 text-[11px]"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={16}
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
    </div>
  );
}

export default SimplesNacionalTable;
