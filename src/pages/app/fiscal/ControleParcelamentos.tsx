import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
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
import { CommentableCell } from "@/components/commentable-cell";
import {
  useAllParcelamentoComentarios,
  useSaveParcelamentoComentario,
} from "@/hooks/use-parcelamentos-comentarios";
import {
  useAllParcelamentos,
  useParcelamentos,
  useSaveParcelamento,
} from "@/hooks/use-parcelamentos";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import {
  DATA_INICIO_BLOCK_TITLE,
  isCompanyInactiveInMonth,
  isPeriodBeforeStart,
} from "@/lib/companies";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyUsesSubmenu } from "@/lib/department-submenus";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";
import {
  PARCELAMENTO_DESABILITADO,
  PARCELAMENTO_ENVIO_OPTIONS,
  PARCELAMENTO_ENVIO_TONE,
  PARCELAMENTO_FIELDS,
  PARCELAMENTO_OPTIONS,
  PARCELAMENTO_TONE,
  type ParcelamentoFieldDef,
  type ParcelamentoFieldKey,
} from "@/lib/parcelamentos";
import { cn, formatCpfCnpj } from "@/lib/utils";
import type { ParcelamentoInput, ParcelamentoRecord } from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Subdepartamento (Fiscal) que define as empresas desta planilha. */
const SUBMENU = "Controle de Parcelamentos";

/** Colunas do cadastro (base dos comentários das quatro primeiras colunas). */
type CadastroKey = "numero" | "uf" | "empresa" | "documento";

/**
 * Controle de Parcelamentos — submenu do departamento Fiscal.
 *
 * N, UF, Empresa e CNPJ vêm do cadastro de empresas. As colunas SIMPLES até
 * MUNICIPAL são listas suspensas com GERADO e DESABILITADO (Desabilitado é
 * pintado com a cor de destaque e segue para os próximos meses até ser
 * alterado). ENVIO tem GERADO e ENVIADO. Todas as células aceitam comentário
 * (clique com o botão direito), que também segue para os meses seguintes.
 */
export default function ControleParcelamentos() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );
  const [busca, setBusca] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {
      numero: "",
      uf: "",
      empresa: "",
      documento: "",
      envio: "",
    };
    for (const field of PARCELAMENTO_FIELDS) initial[field.key] = "";
    return initial;
  });

  const setBuscaField = (key: string, value: string) =>
    setBusca((prev) => ({ ...prev, [key]: value }));

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useParcelamentos(mes);
  const { data: allRecords } = useAllParcelamentos();
  const saveMutation = useSaveParcelamento(mes);
  const { data: comentarios } = useAllParcelamentoComentarios();
  const saveComentario = useSaveParcelamentoComentario(mes);

  const fiscal = findDepartmentByName(departments, FISCAL_DEPARTMENT_NAME);

  // Empresas marcadas com o subdepartamento "Controle de Parcelamentos".
  const rows = (companies ?? [])
    .filter(
      (company) =>
        companyUsesSubmenu(company, fiscal?.id, SUBMENU) &&
        !isCompanyInactiveInMonth(company, mes)
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map<string, ParcelamentoRecord>(
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
   * Valor efetivo da coluna: usa o mês exibido; se estiver em branco, herda do
   * mês anterior mais recente apenas quando ele estiver "Desabilitado" (a
   * indicação de desabilitado segue para os próximos meses até ser alterada).
   */
  const effectiveValue = (
    companyId: string,
    key: ParcelamentoFieldKey
  ): string => {
    const current = recordByCompany.get(companyId)?.[key] as
      | string
      | null
      | undefined;
    if (current) return current;
    const inherited = priorRecords(companyId)
      .map((record) => record[key] as string | null)
      .find((value): value is string => Boolean(value));
    return inherited === PARCELAMENTO_DESABILITADO
      ? PARCELAMENTO_DESABILITADO
      : "";
  };

  /**
   * Comentário efetivo de uma célula: usa o mês exibido; se não houver, herda do
   * mês anterior mais recente que tenha comentário. Um comentário em branco no
   * mês exibido encerra a herança (foi removido naquele mês).
   */
  const commentOf = (companyId: string, campo: string): string | null => {
    const latest = (comentarios ?? [])
      .filter(
        (item) =>
          item.company_id === companyId &&
          item.campo === campo &&
          item.mes_referencia <= mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))[0];
    if (!latest) return null;
    return latest.comentario === "" ? null : latest.comentario;
  };

  /** Remove o comentário a partir do mês exibido (grava comentário em branco). */
  const clearComentario = (companyId: string, campo: string) => {
    saveComentario.mutate({ company_id: companyId, campo, comentario: "" });
  };

  /** UFs presentes nas empresas da tabela (o filtro lista apenas essas). */
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
      selectOrBlank(company.uf, busca.uf) &&
      match(company.name, busca.empresa) &&
      matchDigits(company.documento, busca.documento) &&
      PARCELAMENTO_FIELDS.every((field) =>
        selectOrBlank(effectiveValue(company.id, field.key), busca[field.key])
      ) &&
      selectOrBlank(record?.envio, busca.envio)
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
      ...fields,
      ...patch,
    } as unknown as ParcelamentoInput);
  };

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  const renderFilterInput = (
    key: string,
    label: string,
    widthClass: string
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key] ?? ""}
        onChange={(event) => setBuscaField(key, event.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderFilterSelect = (
    key: string,
    label: string,
    widthClass: string,
    options: readonly string[],
    allLabel?: string
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
          <SelectValue placeholder={allLabel ?? "Todos"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">{allLabel ?? "Todos"}</SelectItem>
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

  /** Célula com comentário (botão direito) para todas as colunas. */
  const commentable = (
    companyId: string,
    campo: string,
    label: string,
    children: ReactNode,
    blocked = false
  ) => (
    <CommentableCell
      disabled={blocked}
      comment={commentOf(companyId, campo)}
      label={label}
      onSave={(text) =>
        saveComentario.mutate({ company_id: companyId, campo, comentario: text })
      }
      onRemove={() => clearComentario(companyId, campo)}
    >
      {children}
    </CommentableCell>
  );

  /** Célula de uma coluna de parcelamento (lista suspensa). */
  const renderFieldCell = (
    companyId: string,
    companyName: string,
    field: ParcelamentoFieldDef,
    blocked: boolean
  ) => {
    const value = effectiveValue(companyId, field.key);
    return commentable(
      companyId,
      field.key,
      `${field.label} — ${mes} — ${companyName}`,
      <Select
        value={value === "" ? "none" : value}
        disabled={blocked}
        onValueChange={(next) => {
          if (blocked) return;
          save(companyId, { [field.key]: next === "none" ? null : next });
        }}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-full min-w-0 px-1 text-[11px]",
            PARCELAMENTO_TONE[value]
          )}
        >
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {PARCELAMENTO_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>,
      blocked
    );
  };

  /** Célula de texto do cadastro (somente leitura, com comentário). */
  const renderCadastroCell = (
    companyId: string,
    companyName: string,
    campo: CadastroKey,
    label: string,
    content: ReactNode,
    blocked: boolean
  ) => commentable(companyId, campo, `${label} — ${mes} — ${companyName}`, content, blocked);

  const renderHeaders = () => (
    <TableRow className="bg-muted hover:bg-muted">
      {renderFilterInput("numero", "N", "w-10")}
      {renderFilterSelect("uf", "UF", "w-12", ufOptions, "Todos")}
      {renderFilterInput("empresa", "Empresa", "w-56")}
      {renderFilterInput("documento", "CNPJ", "w-32")}
      {PARCELAMENTO_FIELDS.map((field) => (
        <TableHead
          key={field.key}
          className={`${HEAD} ${
            field.key === "mei_relp_iss" ? "w-28" : "w-24"
          } align-bottom`}
        >
          <span className="mb-1 block truncate" title={field.label}>
            {field.label}
          </span>
          <Select
            value={busca[field.key] === "" ? "todos" : busca[field.key]}
            onValueChange={(value) =>
              setBuscaField(field.key, value === "todos" ? "" : value)
            }
          >
            <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="branco">Em branco</SelectItem>
              {PARCELAMENTO_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableHead>
      ))}
      {renderFilterSelect(
        "envio",
        "ENVIO",
        "w-24",
        PARCELAMENTO_ENVIO_OPTIONS,
        "Todos"
      )}
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Controle de Parcelamentos</h2>
        <p className="text-sm text-muted-foreground">
          Empresas do departamento {FISCAL_DEPARTMENT_NAME} marcadas com o
          subdepartamento {SUBMENU}.
        </p>
      </div>

      <div className="w-52">
        <Label htmlFor="parcelamentos-mes">Mês de referência</Label>
        <Input
          id="parcelamentos-mes"
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
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed min-w-[1560px]">
            <TableHeader>{renderHeaders()}</TableHeader>
            <TableBody>
              {filteredRows.map((company) => {
                const record = recordByCompany.get(company.id);
                const blocked = startBlockedIds.has(company.id);
                const envio = record?.envio ?? "";
                return (
                  <TableRow
                    key={company.id}
                    title={blocked ? DATA_INICIO_BLOCK_TITLE : undefined}
                  >
                    <TableCell className={`${CELL} w-10`}>
                      {renderCadastroCell(
                        company.id,
                        company.name,
                        "numero",
                        "N",
                        <span className="block truncate font-medium">
                          {company.numero || "—"}
                        </span>,
                        blocked
                      )}
                    </TableCell>
                    <TableCell className={`${CELL} w-12`}>
                      {renderCadastroCell(
                        company.id,
                        company.name,
                        "uf",
                        "UF",
                        <span className="block truncate">
                          {company.uf || "—"}
                        </span>,
                        blocked
                      )}
                    </TableCell>
                    <TableCell className={`${CELL} w-56`}>
                      {renderCadastroCell(
                        company.id,
                        company.name,
                        "empresa",
                        "Empresa",
                        <span
                          className="block truncate font-medium"
                          title={company.name}
                        >
                          {company.name}
                        </span>,
                        blocked
                      )}
                    </TableCell>
                    <TableCell
                      className={`${CELL} w-32 whitespace-nowrap text-muted-foreground`}
                    >
                      {renderCadastroCell(
                        company.id,
                        company.name,
                        "documento",
                        "CNPJ",
                        <span className="block truncate">
                          {formatCpfCnpj(company.documento)}
                        </span>,
                        blocked
                      )}
                    </TableCell>
                    {PARCELAMENTO_FIELDS.map((field) => (
                      <TableCell
                        key={field.key}
                        className={`${CELL} ${
                          field.key === "mei_relp_iss" ? "w-28" : "w-24"
                        }`}
                      >
                        {renderFieldCell(
                          company.id,
                          company.name,
                          field,
                          blocked
                        )}
                      </TableCell>
                    ))}
                    <TableCell className={`${CELL} w-24`}>
                      {commentable(
                        company.id,
                        "envio",
                        `ENVIO — ${mes} — ${company.name}`,
                        <Select
                          value={envio === "" ? "none" : envio}
                          disabled={blocked}
                          onValueChange={(next) => {
                            if (blocked) return;
                            save(company.id, {
                              envio: next === "none" ? null : next,
                            });
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
                              PARCELAMENTO_ENVIO_TONE[envio]
                            )}
                          >
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {PARCELAMENTO_ENVIO_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>,
                        blocked
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma empresa encontrada com os filtros."
                      : `Nenhuma empresa marcada com o subdepartamento ${SUBMENU}. Marque esse subdepartamento no cadastro de empresas (departamento ${FISCAL_DEPARTMENT_NAME}) para que elas apareçam aqui.`}
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
