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
import { CommentableCell } from "@/components/commentable-cell";
import {
  useAllMovimentoFiscal,
  useMovimentoFiscal,
  useSaveMovimentoFiscal,
} from "@/hooks/use-movimento-fiscal";
import {
  useAllMovimentoFiscalComentarios,
  useSaveMovimentoFiscalComentario,
} from "@/hooks/use-movimento-fiscal-comentarios";
import { useCompanies } from "@/hooks/use-companies";
import {
  DATA_INICIO_BLOCK_TITLE,
  isCompanyInactiveInMonth,
  isPeriodBeforeStart,
} from "@/lib/companies";
import {
  LUCRO_DESABILITADO,
  LUCRO_FIELDS,
  LUCRO_OPTIONS,
  LUCRO_TONE,
  type LucroFieldDef,
  type LucroFieldKey,
} from "@/lib/fiscal-lucro-real";
import { cn } from "@/lib/utils";
import type { MovementFiscalInput } from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

interface LucroRealPresumidoTableProps {
  /** Mês de referência do Movimento Fiscal (mesma referência da tabela principal). */
  mes: string;
  /** Tributação selecionada no filtro (Lucro Real ou Lucro Presumido). */
  tributacao: string;
  /** Usuário pode editar o mês exibido? */
  canEdit: boolean;
}

/**
 * Tabela de Lucro Real / Lucro Presumido do Movimento Fiscal.
 *
 * N, Empresa e UF vêm do cadastro de empresas com a tributação selecionada. As
 * colunas de obrigação são listas suspensas (com a opção "Desabilitado", pintada
 * com a cor da tabela, que segue para os próximos meses até ser alterada) e OBS
 * é texto livre, também levado para os meses seguintes. Todas as células de
 * ISSQN até OBS aceitam comentário (botão direito), que também é levado para os
 * meses seguintes até ser alterado ou removido.
 */
export function LucroRealPresumidoTable({
  mes,
  tributacao,
  canEdit,
}: LucroRealPresumidoTableProps) {
  const [busca, setBusca] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {
      numero: "",
      uf: "",
      empresa: "",
      observacoes: "",
    };
    for (const field of LUCRO_FIELDS) initial[field.key] = "";
    return initial;
  });

  const setBuscaField = (key: string, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useMovimentoFiscal(mes);
  const { data: allRecords } = useAllMovimentoFiscal();
  const saveMutation = useSaveMovimentoFiscal(mes);
  const { data: comentarios } = useAllMovimentoFiscalComentarios();
  const saveComentario = useSaveMovimentoFiscalComentario(mes);

  // Empresas do cadastro com a tributação da tabela.
  const rows = (companies ?? [])
    .filter(
      (company) =>
        company.tributacao === tributacao &&
        !isCompanyInactiveInMonth(company, mes)
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map(
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
    key: LucroFieldKey
  ): string => {
    const current = recordByCompany.get(companyId)?.[key] as
      | string
      | null
      | undefined;
    if (current) return current;
    const prior = priorRecords(companyId);
    const inherited = prior
      .map((record) => record[key] as string | null)
      .find((value): value is string => Boolean(value));
    return inherited === LUCRO_DESABILITADO ? LUCRO_DESABILITADO : "";
  };

  /** Observação efetiva (levada para os próximos meses até ser alterada). */
  const effectiveObservacoes = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current && current.observacoes) return current.observacoes;
    return (
      priorRecords(companyId).find((record) => record.observacoes)
        ?.observacoes ?? null
    );
  };

  /**
   * Comentário efetivo de uma célula: usa o mês exibido; se não houver, herda do
   * mês anterior mais recente que tenha comentário (o comentário segue para os
   * meses seguintes até ser alterado). Um comentário em branco no mês exibido
   * encerra a herança (foi removido naquele mês).
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

  /**
   * Remove o comentário a partir do mês exibido: grava um comentário em branco
   * naquele mês, interrompendo a herança para os meses seguintes.
   */
  const clearComentario = (companyId: string, campo: string) => {
    saveComentario.mutate({
      company_id: companyId,
      campo,
      comentario: "",
    });
  };

  /** Empresas bloqueadas no mês exibido (anterior à Data de Início). */
  const startBlockedIds = new Set(
    rows
      .filter((company) => isPeriodBeforeStart(company, mes))
      .map((company) => company.id)
  );

  const filteredRows = rows.filter((company) => {
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
    return (
      match(company.numero, busca.numero) &&
      selectOrBlank(company.uf, busca.uf) &&
      match(company.name, busca.empresa) &&
      LUCRO_FIELDS.every((field) =>
        selectOrBlank(effectiveValue(company.id, field.key), busca[field.key])
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

  const renderFilterInput = (key: string, label: string, widthClass: string) => (
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
    widthClass: string
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
          {LUCRO_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
  );

  /** Célula de uma coluna de obrigação (comentário + lista suspensa). */
  const renderFieldCell = (
    company: (typeof rows)[number],
    field: LucroFieldDef
  ) => {
    const value = effectiveValue(company.id, field.key);
    const blocked = startBlockedIds.has(company.id);
    return (
      <CommentableCell
        disabled={!canEdit || blocked}
        comment={commentOf(company.id, field.key)}
        label={`${field.label} ${mes} — ${company.name}`}
        onSave={(text) =>
          saveComentario.mutate({
            company_id: company.id,
            campo: field.key,
            comentario: text,
          })
        }
        onRemove={() => clearComentario(company.id, field.key)}
      >
        {!canEdit ? (
          <span
            className={cn(
              "inline-block w-full truncate rounded px-1 py-0.5 text-center",
              LUCRO_TONE[value]
            )}
          >
            {value || "—"}
          </span>
        ) : (
          <Select
            value={value === "" ? "none" : value}
            disabled={blocked}
            onValueChange={(next) => {
              if (blocked) return;
              save(company.id, {
                [field.key]: next === "none" ? null : next,
              });
            }}
          >
            <SelectTrigger
              className={cn(
                "h-7 w-full min-w-0 px-1 text-[11px]",
                LUCRO_TONE[value]
              )}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {LUCRO_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CommentableCell>
    );
  };

  if (isLoading) return null;

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        Não foi possível carregar as empresas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Lucro Real / Lucro Presumido — empresas com tributação {tributacao}
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[1424px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {renderFilterInput("numero", "N", "w-10")}
              {renderFilterInput("empresa", "Empresas", "w-56")}
              {renderFilterSelect("uf", "UF", "w-12")}
              {LUCRO_FIELDS.map((field) =>
                renderFilterSelect(
                  field.key,
                  field.label,
                  field.key === "dime_gia_pr" ? "w-24" : "w-20"
                )
              )}
              {renderFilterInput("observacoes", "OBS", "w-72")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const blocked = startBlockedIds.has(company.id);
              return (
                <TableRow
                  key={company.id}
                  title={blocked ? DATA_INICIO_BLOCK_TITLE : undefined}
                >
                  <TableCell
                    className={`${CELL} w-10 whitespace-nowrap text-center font-medium`}
                  >
                    {company.numero || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} w-56`}>
                    <span
                      className="block truncate font-medium"
                      title={company.name}
                    >
                      {company.name}
                    </span>
                  </TableCell>
                  <TableCell className={`${CELL} w-12 whitespace-nowrap`}>
                    {company.uf || "—"}
                  </TableCell>
                  {LUCRO_FIELDS.map((field) => (
                    <TableCell
                      key={field.key}
                      className={`${CELL} ${
                        field.key === "dime_gia_pr" ? "w-24" : "w-20"
                      }`}
                    >
                      {renderFieldCell(company, field)}
                    </TableCell>
                  ))}
                  <TableCell className={`${CELL} w-72`}>
                    <CommentableCell
                      disabled={!canEdit || blocked}
                      comment={commentOf(company.id, "observacoes")}
                      label={`OBS ${mes} — ${company.name}`}
                      onSave={(text) =>
                        saveComentario.mutate({
                          company_id: company.id,
                          campo: "observacoes",
                          comentario: text,
                        })
                      }
                      onRemove={() => clearComentario(company.id, "observacoes")}
                    >
                      <Input
                        key={`${company.id}:${mes}:obs`}
                        defaultValue={effectiveObservacoes(company.id) ?? ""}
                        disabled={!canEdit || blocked}
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
                    </CommentableCell>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className={`${CELL} py-8 text-center text-muted-foreground`}
                >
                  {Object.values(busca).some(Boolean) && rows.length > 0
                    ? "Nenhuma empresa encontrada com os filtros."
                    : `Nenhuma empresa com tributação ${tributacao}. Defina essa tributação no cadastro de empresas para que ela apareça aqui.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
