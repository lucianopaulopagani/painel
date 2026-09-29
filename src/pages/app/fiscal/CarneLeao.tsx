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
import { useCarneLeao, useSaveCarneLeao } from "@/hooks/use-carne-leao";
import { useCompanies } from "@/hooks/use-companies";
import { isCompanyInactiveInMonth } from "@/lib/companies";
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
import type { MovimentoCarneLeaoInput } from "@/lib/types";

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
}

/**
 * Subtabela do Carne Leão — exibida dentro do Movimento Fiscal quando a
 * tributação "Carne Leão" é selecionada no filtro.
 */
export function CarneLeaoTable({ mes }: CarneLeaoTableProps) {
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

  const { data: companies } = useCompanies();
  const { data: records } = useCarneLeao(mes);
  const saveMutation = useSaveCarneLeao(mes);

  const rows = (companies ?? [])
    .filter(
      (company) =>
        company.tributacao === CARNE_LEAO_TRIBUTACAO &&
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
      match(record?.observacoes, busca.observacoes)
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
      ...patch,
    } as unknown as MovimentoCarneLeaoInput;
    saveMutation.mutate(next);
  };

  const renderSelectCell = (
    companyId: string,
    value: string,
    options: readonly string[],
    patchKey: string
  ) => (
    <Select
      value={value === "" ? "none" : value}
      onValueChange={(next) =>
        save(companyId, { [patchKey]: next === "none" ? null : next })
      }
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

  const renderFilterInput = (key: keyof typeof busca, label: string) => (
    <TableHead className={`${HEAD} align-bottom`}>
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
    options: readonly string[]
  ) => (
    <TableHead className={`${HEAD} w-24 align-bottom`}>
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
        <Table className="table-fixed min-w-[1500px]">
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
              {renderFilterInput("empresa", "Empresa")}
              {renderFilterInput("cpf", "CPF")}
              {renderFilterSelect("situacao", "Situação", CARNE_LEAO_SITUACAO_OPTIONS)}
              {renderFilterSelect("prestados", "Prestados", CARNE_LEAO_PRESTADOS_OPTIONS)}
              {renderFilterSelect("tomados", "Tomados", CARNE_LEAO_TOMADOS_OPTIONS)}
              {renderFilterSelect("iss", "ISS Fixo", CARNE_LEAO_ISS_OPTIONS)}
              {renderFilterSelect("carne", "Carne Leão", CARNE_LEAO_CARNE_OPTIONS)}
              {renderFilterSelect("envio", "Envio/Guia", CARNE_LEAO_ENVIO_OPTIONS)}
              {renderFilterInput("observacoes", "Observações")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const record = recordByCompany.get(company.id);
              return (
                <TableRow key={company.id}>
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
                  <TableCell className={`${CELL} w-72`}>
                    <Input
                      key={`${company.id}:${mes}:obs`}
                      defaultValue={record?.observacoes ?? ""}
                      title={record?.observacoes ?? ""}
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
