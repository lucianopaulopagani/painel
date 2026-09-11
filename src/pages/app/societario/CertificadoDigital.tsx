import { useState } from "react";
import { FileText, Loader2, Pencil, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getCertificateStatus,
  type CertificateStatusLevel,
} from "@/lib/certificate-status";
import { printCertificateReport } from "@/lib/certificate-report";
import {
  SOCIETARIO_DEPARTMENT_NAME,
  findDepartmentByName,
} from "@/lib/departments";
import {
  formatDateOnlyBr,
  formatDateTimeBr,
  splitDateTimeLocal,
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

const agendamentoDateOf = (row: CertificateRow): string =>
  row.certificate?.agendamento_at
    ? splitDateTimeLocal(row.certificate.agendamento_at).date
    : "";

export default function CertificadoDigital() {
  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: certificates } = useCertificates();

  const [editing, setEditing] = useState<CertificateRow | null>(null);

  const [empresa, setEmpresa] = useState("");
  const [vencimentoDe, setVencimentoDe] = useState("");
  const [vencimentoAte, setVencimentoAte] = useState("");
  const [agendamentoDe, setAgendamentoDe] = useState("");
  const [agendamentoAte, setAgendamentoAte] = useState("");

  const societario = findDepartmentByName(
    departments,
    SOCIETARIO_DEPARTMENT_NAME
  );

  const rows: CertificateRow[] = (companies ?? [])
    .filter((company) =>
      societario
        ? company.department_links.some(
            (link) => link.department_id === societario.id
          )
        : false
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
    if (
      empresa.trim() &&
      !row.company.name
        .toLowerCase()
        .includes(empresa.trim().toLowerCase())
    ) {
      return false;
    }
    const vencimento = row.certificate?.vencimento ?? "";
    if (vencimentoDe && (!vencimento || vencimento < vencimentoDe)) return false;
    if (vencimentoAte && (!vencimento || vencimento > vencimentoAte))
      return false;
    const agendamento = agendamentoDateOf(row);
    if (agendamentoDe && (!agendamento || agendamento < agendamentoDe))
      return false;
    if (agendamentoAte && (!agendamento || agendamento > agendamentoAte))
      return false;
    return true;
  });

  const hasFilters = Boolean(
    empresa || vencimentoDe || vencimentoAte || agendamentoDe || agendamentoAte
  );

  const clearFilters = () => {
    setEmpresa("");
    setVencimentoDe("");
    setVencimentoAte("");
    setAgendamentoDe("");
    setAgendamentoAte("");
  };

  const handleReport = () => {
    const opened = printCertificateReport(filteredRows, {
      empresa: empresa.trim() || undefined,
      vencimentoDe: vencimentoDe || undefined,
      vencimentoAte: vencimentoAte || undefined,
      agendamentoDe: agendamentoDe || undefined,
      agendamentoAte: agendamentoAte || undefined,
    });
    if (!opened) {
      toast.error("Permita pop-ups no navegador para gerar o relatório.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Certificado digital</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filtro-empresa"
              className="text-xs text-muted-foreground"
            >
              Empresa
            </Label>
            <Input
              id="filtro-empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Buscar por nome"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Vencimento</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="Vencimento de"
                value={vencimentoDe}
                onChange={(e) => setVencimentoDe(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                aria-label="Vencimento até"
                value={vencimentoAte}
                onChange={(e) => setVencimentoAte(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Agendamento</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="Agendamento de"
                value={agendamentoDe}
                onChange={(e) => setAgendamentoDe(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                aria-label="Agendamento até"
                value={agendamentoAte}
                onChange={(e) => setAgendamentoAte(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
          <Button
            size="sm"
            onClick={handleReport}
            disabled={filteredRows.length === 0}
          >
            <FileText className="h-4 w-4" />
            Relatório por vencimento
          </Button>
          <span className="text-xs text-muted-foreground">
            {filteredRows.length} de {rows.length} registro(s)
          </span>
        </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Avisado</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
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
                      <TableCell className="whitespace-nowrap">
                        {formatDateOnlyBr(row.certificate?.vencimento)}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLASS[status.level]}>
                          {status.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLASS[status.level]}>
                          {status.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.company.name}
                      </TableCell>
                      <TableCell>
                        {row.certificate?.avisado === true ? (
                          <Badge className="bg-status-success text-status-success-foreground hover:bg-status-success">
                            Sim
                          </Badge>
                        ) : row.certificate?.avisado === false ? (
                          <Badge className="bg-status-danger text-status-danger-foreground hover:bg-status-danger">
                            Não
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.certificate?.agendamento_at ? (
                          <Badge className="bg-status-warning text-status-warning-foreground hover:bg-status-warning">
                            {formatDateTimeBr(row.certificate.agendamento_at)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-64">
                        {row.certificate?.observacoes ? (
                          <span
                            className="line-clamp-2 text-sm text-muted-foreground"
                            title={row.certificate.observacoes}
                          >
                            {row.certificate.observacoes.length > 100
                              ? `${row.certificate.observacoes.slice(0, 100)}…`
                              : row.certificate.observacoes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                    colSpan={8}
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
