import { useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, Loader2, Pencil, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import CertificateFormDialog from "@/components/societario/CertificateFormDialog";
import { useCertificates } from "@/hooks/use-certificates";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import {
  CERTIFICATE_LEVELS,
  CERTIFICATE_SITUACAO_LABELS,
  CERTIFICATE_STATUS_LABELS,
  getCertificateStatus,
  type CertificateStatusLevel,
} from "@/lib/certificate-status";
import { useTabelaCadastro } from "@/hooks/use-tabela-cadastro";
import { CERTIFICATE_PRODUCTS } from "@/lib/certificate-products";
import { printCertificateReport, downloadCertificateReportExcel } from "@/lib/certificate-report";
import {
  SOCIETARIO_DEPARTMENT_NAME,
  findDepartmentByName,
} from "@/lib/departments";
import { useCadastroLabels } from "@/hooks/use-cadastro-tabelas";
import {
  companyUsesSubmenu,
  isCompanyInSubmenuInYear,
} from "@/lib/department-submenus";
import { isCompanyInactiveToday } from "@/lib/companies";
import {
  formatCpfCnpj,
  formatDateOnlyBr,
  formatDateTimeBr,
} from "@/lib/utils";
import type { CertificateRow } from "@/lib/types";

const STATUS_CLASS: Record<CertificateStatusLevel, string> = {
  vencido:
    "bg-status-danger text-status-danger-foreground hover:bg-status-danger",
  renovar:
    "bg-status-warning text-status-warning-foreground hover:bg-status-warning",
  ativo:
    "bg-status-success text-status-success-foreground hover:bg-status-success",
  "sem-vencimento":
    "bg-status-neutral text-status-neutral-foreground hover:bg-status-neutral",
};

const PRODUCT_CLASS: Record<string, string> = {
  "e-CNPJ A1 12 meses": "bg-zinc-800 text-zinc-100 hover:bg-zinc-800",
  "e-CPF A1 12 meses": "bg-zinc-200 text-zinc-800 hover:bg-zinc-200",
};

const CELL = "px-1 py-1 text-[11px]";
const HEAD =
  "sticky top-0 z-20 h-auto bg-muted px-1 py-1 text-[11px] font-medium text-muted-foreground";

/** Rótulos padrão dos filtros de situação e status (por nível). */
const LEVEL_SITUACAO = CERTIFICATE_SITUACAO_LABELS;
const LEVEL_STATUS = CERTIFICATE_STATUS_LABELS;

/** Tabela deste módulo no Cadastro de Tabelas. */
const TABELA = "Certificado digital";

/** Marcação Sim/Não do certificado (a primeira opção é o Sim). */
const SIM_NAO_OPTIONS = ["Sim", "Não"] as const;

export default function CertificadoDigital() {
  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: certificates } = useCertificates();
  /* Nomes das colunas cadastrados na administração (Cadastro de Tabelas). */
  const columnLabel = useCadastroLabels(SOCIETARIO_DEPARTMENT_NAME);
  /* Opções e cores cadastradas na administração (Cadastro de Tabelas). */
  const cadastro = useTabelaCadastro(SOCIETARIO_DEPARTMENT_NAME, TABELA);
  const situacaoOpcoes = cadastro.options(
    "situacao",
    Object.values(LEVEL_SITUACAO)
  );
  const statusOpcoes = cadastro.options("status", Object.values(LEVEL_STATUS));
  const avisadoOpcoes = cadastro.options("avisado", SIM_NAO_OPTIONS);
  const financOpcoes = cadastro.options("financ", SIM_NAO_OPTIONS);
  const produtoOpcoes = cadastro.options("produto", CERTIFICATE_PRODUCTS);
  /** Rótulo cadastrado de um nível (Situação/Status são calculados no vencimento). */
  const rotuloDoNivel = (
    opcoes: readonly string[],
    padrao: Record<CertificateStatusLevel, string>,
    level: CertificateStatusLevel
  ): string => opcoes[CERTIFICATE_LEVELS.indexOf(level)] ?? padrao[level];
  const rotuloSituacao = (level: CertificateStatusLevel): string =>
    rotuloDoNivel(situacaoOpcoes, LEVEL_SITUACAO, level);
  const rotuloStatus = (level: CertificateStatusLevel): string =>
    rotuloDoNivel(statusOpcoes, LEVEL_STATUS, level);
  /** Sim/Não conforme a lista cadastrada (vazio continua em branco). */
  const rotuloSimNao = (
    opcoes: readonly string[],
    valor: boolean | null | undefined
  ): string =>
    valor == null ? "" : valor ? (opcoes[0] ?? "Sim") : (opcoes[1] ?? "Não");
  /** Nome cadastrado do produto gravado no certificado. */
  const rotuloProduto = (valor: string): string =>
    produtoOpcoes[CERTIFICATE_PRODUCTS.indexOf(valor)] ?? valor;

  const [editing, setEditing] = useState<CertificateRow | null>(null);

  const [filtros, setFiltros] = useState({
    vencimento: "",
    vencimentoDe: "",
    vencimentoAte: "",
    situacao: "",
    status: "",
    empresa: "",
    socio: "",
    socioCpf: "",
    produto: "",
    avisado: "",
    financ: "",
    agendamento: "",
    observacoes: "",
  });

  const societario = findDepartmentByName(
    departments,
    SOCIETARIO_DEPARTMENT_NAME
  );

  /** O módulo não tem exercício: o período considera o ano corrente. */
  const anoAtual = String(new Date().getFullYear());

  const rows: CertificateRow[] = (companies ?? [])
    .filter(
      (company) =>
        companyUsesSubmenu(company, societario?.id, "Certificado digital") &&
        isCompanyInSubmenuInYear(
          company,
          societario?.id,
          "Certificado digital",
          anoAtual
        ) &&
        !isCompanyInactiveToday(company)
    )
    .map((company) => ({
      company,
      certificate:
        (certificates ?? []).find(
          (certificate) => certificate.company_id === company.id
        ) ?? null,
    }))
    .sort((a, b) => {
      const aDue = a.certificate?.vencimento ?? null;
      const bDue = b.certificate?.vencimento ?? null;
      if (!aDue && !bDue) {
        return a.company.name.localeCompare(b.company.name, "pt-BR");
      }
      if (!aDue) return 1;
      if (!bDue) return -1;
      return (
        aDue.localeCompare(bDue) ||
        a.company.name.localeCompare(b.company.name, "pt-BR")
      );
    });

  const filteredRows = rows.filter((row) => {
    const status = getCertificateStatus(row.certificate?.vencimento);
    const vencimento = formatDateOnlyBr(row.certificate?.vencimento);
    const agendamento = row.certificate?.agendamento_at
      ? formatDateTimeBr(row.certificate.agendamento_at)
      : "";
    const produtos = row.certificate?.produtos ?? [];

    const match = (value: string, query: string): boolean =>
      !query || value.toLowerCase().includes(query.toLowerCase());
    const selectOrBlank = (value: string, query: string): boolean => {
      if (query === "branco") return !value;
      return !query || value === query;
    };
    const vencimentoRaw = row.certificate?.vencimento ?? "";
    const inVencimentoRange =
      (!filtros.vencimentoDe || vencimentoRaw >= filtros.vencimentoDe) &&
      (!filtros.vencimentoAte || vencimentoRaw <= filtros.vencimentoAte);

    return (
      inVencimentoRange &&
      match(vencimento, filtros.vencimento) &&
      selectOrBlank(rotuloSituacao(status.level), filtros.situacao) &&
      selectOrBlank(rotuloStatus(status.level), filtros.status) &&
      match(row.company.name, filtros.empresa) &&
      match(row.company.socio_responsavel ?? "", filtros.socio) &&
      match(row.company.socio_cpf ?? "", filtros.socioCpf) &&
      (filtros.produto === ""
        ? true
        : filtros.produto === "branco"
          ? produtos.length === 0
          : produtos.some(
              (produto) => rotuloProduto(produto) === filtros.produto
            )) &&
      selectOrBlank(
        rotuloSimNao(avisadoOpcoes, row.certificate?.avisado),
        filtros.avisado
      ) &&
      selectOrBlank(
        rotuloSimNao(financOpcoes, row.certificate?.financ),
        filtros.financ
      ) &&
      match(agendamento, filtros.agendamento) &&
      match(row.certificate?.observacoes ?? "", filtros.observacoes)
    );
  });

  const hasFilters = Object.values(filtros).some(Boolean);

  const clearFilters = () => {
    setFiltros({
      vencimento: "",
      vencimentoDe: "",
      vencimentoAte: "",
      situacao: "",
      status: "",
      empresa: "",
      socio: "",
      socioCpf: "",
      produto: "",
      avisado: "",
      financ: "",
      agendamento: "",
      observacoes: "",
    });
  };

  const reportFilters = {
    empresa: filtros.empresa.trim() || undefined,
    vencimentoDe: filtros.vencimentoDe || undefined,
    vencimentoAte: filtros.vencimentoAte || undefined,
    agendamentoDe: undefined,
    agendamentoAte: undefined,
  };

  const handleReportPdf = () => {
    const opened = printCertificateReport(filteredRows, reportFilters);
    if (!opened) {
      toast.error("Permita pop-ups no navegador para gerar o relatório.");
    }
  };

  const handleReportExcel = () => {
    downloadCertificateReportExcel(filteredRows, reportFilters);
  };

  const filterInput = (
    key: keyof typeof filtros,
    label: string,
    widthClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={filtros[key]}
        onChange={(e) =>
          setFiltros((prev) => ({ ...prev, [key]: e.target.value }))
        }
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const filterSelect = (
    key: keyof typeof filtros,
    label: string,
    options: readonly string[]
  ) => {
    /* Opções cadastradas na administração (Cadastro de Tabelas). */
    const lista = cadastro.options(key, options);
    return (
    <TableHead className={`${HEAD} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Select
        value={filtros[key] === "" ? "todos" : filtros[key]}
        onValueChange={(value) =>
          setFiltros((prev) => ({
            ...prev,
            [key]: value === "todos" ? "" : value,
          }))
        }
      >
        <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="branco">Em branco</SelectItem>
          {lista.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Certificado digital</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Vencimento entre
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Vencimento de"
              value={filtros.vencimentoDe}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  vencimentoDe: e.target.value,
                }))
              }
              className="h-8 w-40"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              aria-label="Vencimento até"
              value={filtros.vencimentoAte}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  vencimentoAte: e.target.value,
                }))
              }
              className="h-8 w-40"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={filteredRows.length === 0}>
              <FileText className="h-4 w-4" />
              Relatório por vencimento
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReportPdf}>
              <FileText className="h-4 w-4" />
              Gerar em PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Gerar em Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground">
          {filteredRows.length} de {rows.length} registro(s)
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
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
        <div className="max-h-[calc(100dvh-260px)] overflow-auto rounded-lg border">
          <Table className="min-w-[1250px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {filterInput("vencimento", columnLabel("vencimento", "Vencimento"))}
                {filterSelect("situacao", columnLabel("situacao", "Situação"), Object.values(LEVEL_SITUACAO))}
                {filterSelect("status", columnLabel("status", "Status"), Object.values(LEVEL_STATUS))}
                {filterInput("empresa", columnLabel("empresa", "Empresa"))}
                {filterInput("socio", columnLabel("socio", "Responsável"))}
                {filterInput("socioCpf", columnLabel("socioCpf", "CPF"))}
                {filterSelect("produto", columnLabel("produto", "Produto"), CERTIFICATE_PRODUCTS)}
                {filterSelect("avisado", columnLabel("avisado", "Avisado"), ["Sim", "Não"])}
                {filterSelect("financ", columnLabel("financ", "Financ."), ["Sim", "Não"])}
                {filterInput("agendamento", columnLabel("agendamento", "Agendamento"))}
                {filterInput("observacoes", columnLabel("observacoes", "Observações"))}
                <TableHead className={`${HEAD} w-20 text-right align-bottom`}>
                  <span className="mb-1 block">{columnLabel("acoes", "Ações")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const status = getCertificateStatus(
                    row.certificate?.vencimento
                  );
                  return (
                    <TableRow key={row.company.id}>
                      <TableCell className={`${CELL} whitespace-nowrap`}>
                        {formatDateOnlyBr(row.certificate?.vencimento)}
                      </TableCell>
                      <TableCell className={CELL}>
                        <Badge
                          className={
                            cadastro.tone(
                              "situacao",
                              rotuloSituacao(status.level)
                            ) ?? STATUS_CLASS[status.level]
                          }
                        >
                          {status.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className={CELL}>
                        <Badge
                          className={
                            cadastro.tone(
                              "status",
                              rotuloStatus(status.level)
                            ) ?? STATUS_CLASS[status.level]
                          }
                        >
                          {rotuloStatus(status.level)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${CELL} font-medium`}>
                        <span
                          className="block max-w-64 truncate"
                          title={row.company.name}
                        >
                          {row.company.name}
                        </span>
                      </TableCell>
                      <TableCell className={CELL}>
                        <span
                          className="block max-w-32 truncate"
                          title={row.company.socio_responsavel ?? undefined}
                        >
                          {row.company.socio_responsavel || "—"}
                        </span>
                      </TableCell>
                      <TableCell className={CELL}>
                        <span
                          className="block max-w-32 truncate text-muted-foreground"
                          title={row.company.socio_cpf ?? undefined}
                        >
                          {formatCpfCnpj(row.company.socio_cpf ?? "") || "—"}
                        </span>
                      </TableCell>
                      <TableCell className={CELL}>
                        {row.certificate && row.certificate.produtos.length > 0 ? (
                          <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                            {row.certificate.produtos.map((produto) => (
                              <Badge
                                key={produto}
                                className={`${cadastro.tone("produto", produto) ?? PRODUCT_CLASS[produto] ?? ""} whitespace-nowrap`}
                                variant={
                                  (cadastro.tone("produto", produto) ??
                                  PRODUCT_CLASS[produto])
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {produto}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={CELL}>
                        {row.certificate?.avisado == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            className={
                              cadastro.tone(
                                "avisado",
                                rotuloSimNao(
                                  avisadoOpcoes,
                                  row.certificate?.avisado
                                )
                              ) ??
                              (row.certificate?.avisado
                                ? "bg-status-success text-status-success-foreground hover:bg-status-success"
                                : "bg-status-danger text-status-danger-foreground hover:bg-status-danger")
                            }
                          >
                            {rotuloSimNao(avisadoOpcoes, row.certificate?.avisado)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={CELL}>
                        {row.certificate?.financ == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            className={
                              cadastro.tone(
                                "financ",
                                rotuloSimNao(
                                  financOpcoes,
                                  row.certificate?.financ
                                )
                              ) ??
                              (row.certificate?.financ
                                ? "bg-status-success text-status-success-foreground hover:bg-status-success"
                                : "bg-status-danger text-status-danger-foreground hover:bg-status-danger")
                            }
                          >
                            {rotuloSimNao(financOpcoes, row.certificate?.financ)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`${CELL} whitespace-nowrap`}>
                        {row.certificate?.agendamento_at ? (
                          <Badge className="bg-status-warning text-status-warning-foreground hover:bg-status-warning">
                            {formatDateTimeBr(row.certificate.agendamento_at)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`${CELL} max-w-64`}>
                        {row.certificate?.observacoes ? (
                          <span
                            className="block truncate text-[11px] text-muted-foreground"
                            title={row.certificate.observacoes}
                          >
                            {row.certificate.observacoes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`${CELL} text-right`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar certificado"
                          onClick={() => setEditing(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {rows.length === 0
                      ? `Nenhuma empresa vinculada ao departamento ${SOCIETARIO_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`
                      : "Nenhum registro encontrado com os filtros aplicados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CertificateFormDialog
        row={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
