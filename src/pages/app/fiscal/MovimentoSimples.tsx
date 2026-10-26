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
import { Input } from "@/components/ui/input";
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
import {
  useAllMovimentoFiscal,
  useMovimentoFiscal,
  useSaveMovimentoFiscal,
} from "@/hooks/use-movimento-fiscal";
import { SITUACAO_TONE } from "@/lib/fiscal";
import { cn, formatCpfCnpj } from "@/lib/utils";
import { CompanyNumber } from "@/components/company-number";
import type {
  CompanyWithDepartments,
  MovementFiscalInput,
  MovementFiscalRecord,
} from "@/lib/types";

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/**
 * Tributações que usam a tabela mensal simplificada (modelo das planilhas
 * SM-Mensal e EMPREG PF): N, UF, Empresa, CNPJ, Inscrição Estadual (do cadastro
 * de empresas), Situação e Observação.
 */
export const MOVIMENTO_SIMPLES_TRIBUTACOES = [
  "Simples Nacional/SM-Mensal",
  "Empregada Doméstica",
  "Pessoa Física",
] as const;

/** Situação desta tabela: apenas OK. */
export const MOVIMENTO_SIMPLES_SITUACAO_OPTIONS = ["OK"] as const;

interface MovimentoSimplesTableProps {
  /** Mês de referência do Movimento Fiscal. */
  mes: string;
  /** Tributação exibida na tabela. */
  tributacao: string;
  /**
   * Empresas já filtradas pelo Movimento Fiscal (departamento Fiscal, filtro de
   * Responsável e mês). A tabela apenas separa as da tributação exibida.
   */
  companies: CompanyWithDepartments[];
}

/**
 * Tabela mensal simplificada das tributações SM-Mensal (Simples Nacional/
 * SM-Mensal), Empregada Doméstica e Pessoa Física — exibida dentro do
 * Movimento Fiscal quando uma delas é selecionada no filtro de Tributação.
 *
 * Colunas: N, UF, Empresa, CNPJ e Inscrição Estadual (todas do cadastro de
 * empresas), Situação (apenas OK) e Observação (texto, editado pelo botão de
 * Ações e levado para os meses seguintes).
 */
export function MovimentoSimplesTable({
  mes,
  tributacao,
  companies,
}: MovimentoSimplesTableProps) {
  const [busca, setBusca] = useState({
    numero: "",
    uf: "",
    empresa: "",
    cnpj: "",
    ie: "",
    situacao: "",
    observacoes: "",
  });
  /* Diálogo do botão de Ações da coluna Observação. */
  const [obsDialog, setObsDialog] = useState<{
    companyId: string;
    empresa: string;
    numero: string;
  } | null>(null);
  const [obsText, setObsText] = useState("");

  const setBuscaField = (key: keyof typeof busca, value: string) =>
    setBusca((prev) => ({ ...prev, [key]: value }));

  const { data: records } = useMovimentoFiscal(mes);
  const { data: allRecords } = useAllMovimentoFiscal();
  const saveMutation = useSaveMovimentoFiscal(mes);

  const rows = companies
    .filter((company) => company.tributacao === tributacao)
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
      matchDigits(company.documento, busca.cnpj) &&
      match(company.inscricao_estadual, busca.ie) &&
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
        {tributacao} — empresas do departamento Fiscal
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed min-w-[1180px]">
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
              {renderFilterInput("cnpj", "CNPJ", "w-32")}
              {renderFilterInput("ie", "Insc. Estadual", "w-32")}
              <TableHead className={`${HEAD} w-24 align-bottom`}>
                <span className="mb-1 block whitespace-nowrap">Status</span>
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
                    {MOVIMENTO_SIMPLES_SITUACAO_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              {renderFilterInput("observacoes", "Observação", "w-[22rem]")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((company) => {
              const record = recordByCompany.get(company.id);
              const situacao = record?.situacao ?? "";
              const observacoes = effectiveObservacoes(company.id) ?? "";
              return (
                <TableRow key={company.id}>
                  <TableCell
                    className={`${CELL} w-12 whitespace-nowrap text-center font-medium`}
                  >
                    <CompanyNumber company={company} />
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
                  <TableCell
                    className={`${CELL} w-32 whitespace-nowrap text-muted-foreground`}
                  >
                    {formatCpfCnpj(company.documento)}
                  </TableCell>
                  <TableCell className={`${CELL} w-32 truncate`}>
                    {company.inscricao_estadual || "—"}
                  </TableCell>
                  <TableCell className={`${CELL} w-24`}>
                    <Select
                      value={situacao === "" ? "none" : situacao}
                      onValueChange={(next) =>
                        save(company.id, {
                          situacao: next === "none" ? null : next,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-full min-w-0 px-1 text-[11px] font-semibold",
                          SITUACAO_TONE[situacao]
                        )}
                      >
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {MOVIMENTO_SIMPLES_SITUACAO_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={`${CELL} w-[22rem]`}>
                    <div className="flex items-center gap-1">
                      <span
                        className="block h-7 flex-1 truncate py-1"
                        title={observacoes}
                      >
                        {observacoes || "—"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        title="Ações — observação"
                        onClick={() => {
                          setObsText(observacoes);
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
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className={`${CELL} py-8 text-center text-muted-foreground`}
                >
                  {rows.length > 0
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
            <DialogTitle>Observação</DialogTitle>
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

export default MovimentoSimplesTable;
