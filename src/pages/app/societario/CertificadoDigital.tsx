import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  SOCIETARIO_DEPARTMENT_NAME,
  findDepartmentByName,
} from "@/lib/departments";
import { formatDateOnlyBr, formatDateTimeBr } from "@/lib/utils";
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

export default function CertificadoDigital() {
  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: certificates } = useCertificates();

  const [editing, setEditing] = useState<CertificateRow | null>(null);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Certificado digital</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
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
              {rows.length > 0 ? (
                rows.map((row) => {
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
                    Nenhuma empresa vinculada ao departamento{" "}
                    {SOCIETARIO_DEPARTMENT_NAME}. Marque esse departamento no
                    cadastro de empresas para que elas apareçam aqui.
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
