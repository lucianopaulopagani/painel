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
import { useCarneLeao, useCarneLeaoAll, useSaveCarneLeao } from "@/hooks/use-carne-leao";
import { DATA_INICIO_BLOCK_TITLE, isPeriodBeforeStart } from "@/lib/companies";
import {
  CARNE_LEAO_CARNE_OPTIONS,
  CARNE_LEAO_ENVIO_OPTIONS,
  CARNE_LEAO_ISS_OPTIONS,
  CARNE_LEAO_PRESTADOS_OPTIONS,
  CARNE_LEAO_SITUACAO_OPTIONS,
  CARNE_LEAO_TOMADOS_OPTIONS,
  CARNE_LEAO_TRIBUTACAO,
} from "@/lib/carne-leao";
import { cn, formatCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments, MovimentoCarneLeaoInput } from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Cores das opções (padrão dos demais módulos). */
const TONE: Record<string, string> = {
  OK: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  "OK-SM":
    "bg-status-success text-status-success-foreground hover:bg-status-success/90",
  "OK-ENT":
    "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
  FAZENDO:
    "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
  SM: "bg-primary/10 text-primary hover:bg-primary/15",
};

interface CarneLeaoTableProps {
  /** Mês de referência do Movimento Fiscal (mesma referência da tabela principal). */
  mes: string;
  /**
   * Empresas já filtradas pelo Movimento Fiscal (departamento Fiscal, filtro de
   * Responsável e mês). A subtabela apenas separa as de Carne Leão.
   */
  companies: CompanyWithDepartments[];
}

/**
 * Subtabela do Carne Leão — exibida dentro do Movimento Fiscal quando a
 * tributação "Carne Leão" é selecionada no filtro.
 */
export function CarneLeaoTable({ mes, companies }: CarneLeaoTableProps) {
  const [busca, setBusca] = useState({
    numero: "",
    uf: "",
    empresa: "",
    cpf: "",
    situacao: "",
    prestados: "",
    tomados: "",
    iss: "",
    carne: "",
    envio: "",
    observacoes: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: records } = useCarneLeao(mes);
  const { data: allRecords } = useCarneLeaoAll();
  const saveMutation = useSaveCarneLeao(mes);

  const rows = companies
    .filter((company) => company.tributacao === CARNE_LEAO_TRIBUTACAO)
    .sort((a, b) => {
      if (!a.numero && !b.numero) return a.name.localeCompare(b.name, "pt-BR");
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /**
   * Observação efetiva: usa o mês atual; se estiver vazia, herda do mês
   * anterior mais recente (leva para os meses seguintes até ser alterada).
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
      match(company.uf, busca.uf) &&
      match(company.name, busca.empresa) &&
      match(company.documento, busca.cpf) &&
      selectOrBlank(record?.situacao, busca.situacao) &&
      selectOrBlank(record?.prestados, busca.prestados) &&
      selectOrBlank(record?.tomados, busca.tomados) &&
      selectOrBlank(record?.iss_fixo, busca.iss) &&
      selectOrBlank(record?.carne_leao, busca.carne) &&
      selectOrBlank(record?.envio_guia, busca.envio) &&
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
    const next = {
      company_id: companyId,
      mes_referencia: mes,
      ...fields,
      observacoes: effectiveObservacoes(companyId) ?? null,
      ...patch,
    } as unknown as MovimentoCarneLeaoInput;
    saveMutation.mutate(next);
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
          "h-7 w-full min-w-0 px-1 text-xs font-semibold",
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

  const renderFilterInput = (
    key: keyof typeof busca,
    label: string,
    widthClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[],
    widthClass = "w-24"
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
        Carne Leão — empresas com tributação {CARNE_LEAO_TRIBUTACAO}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[1424px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className={`${HEAD} w-12 align-bottom`}>
                <span className="mb-1 block">N</span>
                <Input
                  value={busca.numero}
                  onChange={(e) => setBuscaField("numero", e.target.value)}
                  placeholder="Filtrar"
                  className="h-6 w-full min-w-0 px-1 text-xs"
                />
              </TableHead>
              <TableHead className={`${HEAD} w-12 align-bottom`}>
                <span className="mb-1 block">UF</span>
                <Input
                  value={busca.uf}
                  onChange={(e) => setBuscaField("uf", e.target.value)}
                  placeholder="Filtrar"
                  className="h-6 w-full min-w-0 px-1 text-xs"
                />
              </TableHead>
              {renderFilterInput("empresa", "Empresa", "w-48")}
              {renderFilterInput("cpf", "CPF", "w-28")}
              {renderFilterSelect("situacao", "Situação", CARNE_LEAO_SITUACAO_OPTIONS, "w-28")}
              {renderFilterSelect("prestados", "Prestados", CARNE_LEAO_PRESTADOS_OPTIONS)}
              {renderFilterSelect("tomados", "Tomados", CARNE_LEAO_TOMADOS_OPTIONS)}
              {renderFilterSelect("iss", "ISS Fixo", CARNE_LEAO_ISS_OPTIONS)}
              {renderFilterSelect("carne", "Carne Leão", CARNE_LEAO_CARNE_OPTIONS)}
              {renderFilterSelect("envio", "Envio/Guia", CARNE_LEAO_ENVIO_OPTIONS, "w-28")}
              {renderFilterInput("observacoes", "Observações", "w-[26rem]")}
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
                  <TableCell className={`${CELL} whitespace-nowrap text-center font-medium`}>
                    {company.numero || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} whitespace-nowrap`}>
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
                  <TableCell className={`${CELL} whitespace-nowrap text-muted-foreground`}>
                    {formatCpfCnpj(company.documento)}
                  </TableCell>
                  <TableCell className={`${CELL} w-28`}>
                    {renderSelectCell(
                      company.id,
                      record?.situacao ?? "",
                      CARNE_LEAO_SITUACAO_OPTIONS,
                      "situacao"
                    )}
                  </TableCell>
                  <TableCell className={`${CELL} w-24`}>
                    {renderSelectCell(
                      company.id,
                      record?.prestados ?? "",
                      CARNE_LEAO_PRESTADOS_OPTIONS,
                      "prestados"
                    )}
                  </TableCell>
                  <TableCell className={`${CELL} w-24`}>
                    {renderSelectCell(
                      company.id,
                      record?.tomados ?? "",
                      CARNE_LEAO_TOMADOS_OPTIONS,
                      "tomados"
                    )}
                  </TableCell>
                  <TableCell className={`${CELL} w-24`}>
                    {renderSelectCell(
                      company.id,
                      record?.iss_fixo ?? "",
                      CARNE_LEAO_ISS_OPTIONS,
                      "iss_fixo"
                    )}
                  </TableCell>
                  <TableCell className={`${CELL} w-24`}>
                    {renderSelectCell(
                      company.id,
                      record?.carne_leao ?? "",
                      CARNE_LEAO_CARNE_OPTIONS,
                      "carne_leao"
                    )}
                  </TableCell>
                  <TableCell className={`${CELL} w-28`}>
                    {renderSelectCell(
                      company.id,
                      record?.envio_guia ?? "",
                      CARNE_LEAO_ENVIO_OPTIONS,
                      "envio_guia"
                    )}
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
                  colSpan={11}
                  className={`${CELL} py-8 text-center text-muted-foreground`}
                >
                  {Object.values(busca).some(Boolean) && rows.length > 0
                    ? "Nenhuma empresa encontrada com os filtros."
                    : `Nenhuma empresa com tributação ${CARNE_LEAO_TRIBUTACAO}. Defina essa tributação no cadastro de empresas para que ela apareça aqui.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default CarneLeaoTable;
