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
import { cn } from "@/lib/utils";
import type {
  CompanyWithDepartments,
  MovementFiscalInput,
  MovementFiscalRecord,
} from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Tributação desta subtabela. */
export const MEI_TRIBUTACAO = "MEI";

/** Situação do MEI: apenas OK e FAZENDO. */
export const MEI_SITUACAO_OPTIONS = ["OK", "FAZENDO"] as const;

/** Cores: OK = finalizada (verde); FAZENDO = pendente (vermelho). */
const TONE: Record<string, string> = {
  OK: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  FAZENDO:
    "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
};

interface MeiTableProps {
  /** Mês de referência do Movimento Fiscal. */
  mes: string;
  /**
   * Empresas já filtradas pelo Movimento Fiscal (departamento Fiscal, filtro de
   * Responsável e mês). A subtabela apenas separa as de MEI.
   */
  companies: CompanyWithDepartments[];
}

/**
 * Subtabela do MEI — exibida dentro do Movimento Fiscal quando a tributação
 * "MEI" é selecionada. Colunas: N, UF, Empresa, Situação e Observação.
 *
 * A Situação tem apenas OK (finalizada) e FAZENDO (pendente) e alimenta os
 * dashboards do Movimento Fiscal com esses mesmos parâmetros.
 */
export function MeiTable({ mes, companies }: MeiTableProps) {
  const [busca, setBusca] = useState({
    numero: "",
    uf: "",
    empresa: "",
    situacao: "",
    observacoes: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) =>
    setBusca((prev) => ({ ...prev, [key]: value }));

  const { data: records } = useMovimentoFiscal(mes);
  const { data: allRecords } = useAllMovimentoFiscal();
  const saveMutation = useSaveMovimentoFiscal(mes);

  const rows = companies
    .filter((company) => company.tributacao === MEI_TRIBUTACAO)
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map<string, MovementFiscalRecord>(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /**
   * Observação efetiva: usa o mês exibido; se estiver vazia, herda do mês
   * anterior mais recente (segue para os meses seguintes até ser alterada).
   */
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
      selectOrBlank(record?.situacao, busca.situacao) &&
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

  const renderFilterInput = (
    key: keyof typeof busca,
    label: string,
    widthClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(event) => setBuscaField(key, event.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        MEI — empresas com tributação {MEI_TRIBUTACAO}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[820px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {renderFilterInput("numero", "N", "w-12")}
              <TableHead className={`${HEAD} w-16 align-bottom`}>
                <span className="mb-1 block whitespace-nowrap">UF</span>
                <Select
                  value={busca.uf === "" ? "todos" : busca.uf}
                  onValueChange={(value) =>
                    setBuscaField("uf", value === "todos" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="branco">Em branco</SelectItem>
                    {ufOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              {renderFilterInput("empresa", "Empresa", "w-[22rem]")}
              <TableHead className={`${HEAD} w-28 align-bottom`}>
                <span className="mb-1 block whitespace-nowrap">Situação</span>
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
                    {MEI_SITUACAO_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              {renderFilterInput("observacoes", "Observação", "w-[26rem]")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const situacao = recordByCompany.get(company.id)?.situacao ?? "";
              const blocked = startBlockedIds.has(company.id);
              return (
                <TableRow
                  key={company.id}
                  title={blocked ? DATA_INICIO_BLOCK_TITLE : undefined}
                >
                  <TableCell
                    className={`${CELL} w-12 whitespace-nowrap text-center font-medium`}
                  >
                    {company.numero || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} w-16 whitespace-nowrap`}>
                    {company.uf || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} w-[22rem]`}>
                    <span
                      className="block truncate font-medium"
                      title={company.name}
                    >
                      {company.name}
                    </span>
                  </TableCell>
                  <TableCell className={`${CELL} w-28`}>
                    <Select
                      value={situacao === "" ? "none" : situacao}
                      disabled={blocked}
                      onValueChange={(next) => {
                        if (blocked) return;
                        save(company.id, {
                          situacao: next === "none" ? null : next,
                        });
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
                          TONE[situacao]
                        )}
                      >
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {MEI_SITUACAO_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={`${CELL} w-[26rem]`}>
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
                  colSpan={5}
                  className={`${CELL} py-8 text-center text-muted-foreground`}
                >
                  {Object.values(busca).some(Boolean) && rows.length > 0
                    ? "Nenhuma empresa encontrada com os filtros."
                    : `Nenhuma empresa com tributação ${MEI_TRIBUTACAO}. Defina essa tributação no cadastro de empresas para que ela apareça aqui.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default MeiTable;
