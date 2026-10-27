import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SITUACAO_OPTIONS, SITUACAO_TONE } from "@/lib/fiscal";
import {
  LUCRO_DESABILITADO,
  LUCRO_FIELDS,
  LUCRO_OPTIONS,
  LUCRO_TONE,
  type LucroFieldDef,
  type LucroFieldKey,
} from "@/lib/fiscal-lucro-real";
import {
  useFieldOptions,
  useFieldTone,
  useStatusOptions,
  useStatusTone,
} from "@/hooks/use-tributacao-status";
import { useColumnLabel } from "@/hooks/use-fiscal-colunas";
import { cn } from "@/lib/utils";
import { CompanyNumber } from "@/components/company-number";
import type { CompanyWithDepartments, MovementFiscalInput } from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

interface LucroRealPresumidoTableProps {
  /** Mês de referência do Movimento Fiscal (mesma referência da tabela principal). */
  mes: string;
  /** Tributação selecionada no filtro (Lucro Real ou Lucro Presumido). */
  tributacao: string;
  /** Usuário pode editar o mês exibido? */
  canEdit: boolean;
  /**
   * Empresas já filtradas pelo Movimento Fiscal (departamento Fiscal, filtro de
   * Responsável e mês). A subtabela apenas separa as da tributação exibida.
   */
  companies: CompanyWithDepartments[];
}

/**
 * Tabela de Lucro Real / Lucro Presumido do Movimento Fiscal.
 *
 * N, Empresa e UF vêm do cadastro de empresas com a tributação selecionada. As
 * coluna Situação usa os mesmos campos do Simples Nacional (OK, OK-ENT, OK-SM,
 * FAZENDO) e alimenta o dashboard com os mesmos parâmetros; as demais colunas de
 * obrigação são listas suspensas (com a opção "Desabilitado", pintada
 * com a cor da tabela, que segue para os próximos meses até ser alterada) e OBS
 * é texto livre, também levado para os meses seguintes. Todas as células de
 * ISSQN até OBS aceitam comentário (botão direito), que também é levado para os
 * meses seguintes até ser alterado ou removido.
 */
export function LucroRealPresumidoTable({
  mes,
  tributacao,
  canEdit,
  companies,
}: LucroRealPresumidoTableProps) {
  const [busca, setBusca] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {
      numero: "",
      uf: "",
      empresa: "",
      situacao: "",
      observacoes: "",
    };
    for (const field of LUCRO_FIELDS) initial[field.key] = "";
    return initial;
  });

  const setBuscaField = (key: string, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  /* Diálogo do botão de Ações da coluna OBS. */
  const [obsDialog, setObsDialog] = useState<{
    companyId: string;
    empresa: string;
    numero: string;
  } | null>(null);
  const [obsText, setObsText] = useState("");

  /** Status cadastrados para esta tributação (com fallback). */
  const resolveStatusOptions = useStatusOptions();
  const resolveStatusTone = useStatusTone();
  const resolveFieldOptions = useFieldOptions();
  const resolveFieldTone = useFieldTone();
  const columnLabel = useColumnLabel();
  const situacaoOptions = resolveStatusOptions(tributacao, SITUACAO_OPTIONS);

  const { data: records } = useMovimentoFiscal(mes);
  const { data: allRecords } = useAllMovimentoFiscal();
  const saveMutation = useSaveMovimentoFiscal(mes);
  const { data: comentarios } = useAllMovimentoFiscalComentarios();
  const saveComentario = useSaveMovimentoFiscalComentario(mes);

  // Empresas do Movimento Fiscal com a tributação da tabela.
  const rows = companies
    .filter((company) => company.tributacao === tributacao)
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

  /** UFs presentes nas empresas da tabela (o filtro lista apenas essas). */
  const ufOptions = Array.from(
    new Set(
      rows.map((company) => company.uf).filter((uf): uf is string => Boolean(uf))
    )
  ).sort();

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
      selectOrBlank(
        recordByCompany.get(company.id)?.situacao,
        busca.situacao
      ) &&
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
    widthClass: string,
    options: readonly string[] = LUCRO_OPTIONS
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

  /**
   * Célula de Situação — mesmos campos do Simples Nacional (OK, OK-ENT, OK-SM,
   * FAZENDO). Os valores alimentam o dashboard com os mesmos parâmetros.
   */
  const renderSituacaoCell = (company: (typeof rows)[number]) => {
    const value = recordByCompany.get(company.id)?.situacao ?? "";
    if (!canEdit) {
      return (
        <span
          className={cn(
            "inline-block w-full truncate rounded px-1 py-0.5 text-center",
            resolveStatusTone(tributacao, value) ?? SITUACAO_TONE[value]
          )}
        >
          {value || "—"}
        </span>
      );
    }
    return (
      <Select
        value={value === "" ? "none" : value}
        onValueChange={(next) => {
          save(company.id, { situacao: next === "none" ? null : next });
        }}
      >
        <SelectTrigger
          className={cn("h-7 w-full min-w-0 px-1 text-[11px]", resolveStatusTone(tributacao, value) ?? SITUACAO_TONE[value])}
        >
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {situacaoOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  /** Célula de uma coluna de obrigação (comentário + lista suspensa). */
  const renderFieldCell = (
    company: (typeof rows)[number],
    field: LucroFieldDef
  ) => {
    const value = effectiveValue(company.id, field.key);
    return (
      <CommentableCell
        disabled={!canEdit}
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
              resolveFieldTone(tributacao, field.key, value) ??
                LUCRO_TONE[value]
            )}
          >
            {value || "—"}
          </span>
        ) : (
          <Select
            value={value === "" ? "none" : value}
            onValueChange={(next) => {
              save(company.id, {
                [field.key]: next === "none" ? null : next,
              });
            }}
          >
            <SelectTrigger
              className={cn(
                "h-7 w-full min-w-0 px-1 text-[11px]",
                resolveFieldTone(tributacao, field.key, value) ??
                  LUCRO_TONE[value]
              )}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {resolveFieldOptions(
                tributacao,
                field.key,
                LUCRO_OPTIONS
              ).map((option) => (
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

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Lucro Real / Lucro Presumido — empresas com tributação {tributacao}
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[1520px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {renderFilterInput("numero", "N", "w-10")}
              {renderFilterInput("empresa", "Empresas", "w-56")}
              {renderFilterSelect("uf", "UF", "w-12", ufOptions)}
              <TableHead className={`${HEAD} w-24 align-bottom`}>
                <span className="mb-1 block whitespace-nowrap">
                  {columnLabel("situacao", "Status")}
                </span>
                <Select
                  value={busca.situacao === "" ? "todos" : busca.situacao}
                  onValueChange={(value) =>
                    setBuscaField("situacao", value === "todos" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="branco">Em branco</SelectItem>
                    {situacaoOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              {LUCRO_FIELDS.map((field) =>
                renderFilterSelect(
                  field.key,
                  columnLabel(field.key, field.label),
                  field.key === "dime_gia_pr" ? "w-24" : "w-20",
                  resolveFieldOptions(tributacao, field.key, LUCRO_OPTIONS)
                )
              )}
              {renderFilterInput("observacoes", "OBS", "w-72")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              return (
                <TableRow key={company.id}>
                  <TableCell
                    className={`${CELL} w-10 whitespace-nowrap text-center font-medium`}
                  >
                    <CompanyNumber company={company} />
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
                  <TableCell className={`${CELL} w-24`}>
                    {renderSituacaoCell(company)}
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
                      disabled={!canEdit}
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
                      <div className="flex items-center gap-1">
                        <span
                          className="block h-7 flex-1 truncate py-1"
                          title={effectiveObservacoes(company.id) ?? ""}
                        >
                          {effectiveObservacoes(company.id) || "—"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          title="Ações — observação"
                          onClick={() => {
                            setObsText(effectiveObservacoes(company.id) ?? "");
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
                    </CommentableCell>
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
                    : `Nenhuma empresa com tributação ${tributacao}. Defina essa tributação no cadastro de empresas para que ela apareça aqui.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
            A observação é levada para os meses seguintes até ser alterada. Para
            anotações por célula, use o botão direito na coluna desejada.
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
