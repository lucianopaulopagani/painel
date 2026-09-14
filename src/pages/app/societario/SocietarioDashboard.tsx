import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCertificates } from "@/hooks/use-certificates";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { getCertificateStatus, type CertificateStatusLevel } from "@/lib/certificate-status";
import { SOCIETARIO_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { cn } from "@/lib/utils";

const LEVEL_CARDS: {
  level: CertificateStatusLevel;
  label: string;
  className: string;
}[] = [
  {
    level: "ativo",
    label: "Ativos",
    className: "bg-status-success text-status-success-foreground",
  },
  {
    level: "vencido",
    label: "Vencidos",
    className: "bg-status-danger text-status-danger-foreground",
  },
  {
    level: "renovar",
    label: "Renovar",
    className: "bg-status-warning text-status-warning-foreground",
  },
  {
    level: "sem-vencimento",
    label: "Sem vencimento",
    className: "bg-status-neutral text-status-neutral-foreground",
  },
];

export default function SocietarioDashboard() {
  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: certificates } = useCertificates();

  const societario = findDepartmentByName(
    departments,
    SOCIETARIO_DEPARTMENT_NAME
  );

  const rows = (companies ?? []).filter((company) =>
    societario
      ? company.department_links.some(
          (link) => link.department_id === societario.id
        )
      : false
  );

  const counts: Record<CertificateStatusLevel, number> = {
    ativo: 0,
    vencido: 0,
    renovar: 0,
    "sem-vencimento": 0,
  };

  for (const company of rows) {
    const certificate = (certificates ?? []).find(
      (item) => item.company_id === company.id
    );
    counts[getCertificateStatus(certificate?.vencimento).level] += 1;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Situação dos certificados digitais das empresas do departamento{" "}
          {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar o dashboard.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_CARDS.map((card) => (
            <Card key={card.level}>
              <CardHeader
                className={cn("rounded-t-lg pb-2", card.className)}
              >
                <CardTitle className="text-sm font-semibold">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-3xl font-bold tabular-nums">
                  {counts[card.level]}
                </div>
                <CardDescription className="mt-1">
                  {counts[card.level] === 1
                    ? "certificado"
                    : "certificados"}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
