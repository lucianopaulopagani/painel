import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { CERTIFICATE_PRODUCTS } from "@/lib/certificate-products";
import { SOCIETARIO_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { cn } from "@/lib/utils";

const MESES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

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

  const certificateOf = (companyId: string) =>
    (certificates ?? []).find((item) => item.company_id === companyId);

  const counts: Record<CertificateStatusLevel, number> = {
    ativo: 0,
    vencido: 0,
    renovar: 0,
    "sem-vencimento": 0,
  };

  for (const company of rows) {
    counts[getCertificateStatus(certificateOf(company.id)?.vencimento).level] += 1;
  }

  // Quantidade por tipo de produto.
  const productCounts = new Map<string, number>();
  for (const company of rows) {
    for (const produto of certificateOf(company.id)?.produtos ?? []) {
      productCounts.set(produto, (productCounts.get(produto) ?? 0) + 1);
    }
  }

  // Certificados a vencer nos próximos 12 meses.
  const now = new Date();
  const months: { key: string; label: string; count: number }[] = [];
  for (let index = 0; index < 12; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `${MESES[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`,
      count: 0,
    });
  }
  for (const company of rows) {
    const vencimento = certificateOf(company.id)?.vencimento;
    if (!vencimento) continue;
    const [year, month] = vencimento.split("-").map(Number);
    const bucket = months.findIndex(
      (entry) => entry.key === `${year}-${String(month).padStart(2, "0")}`
    );
    if (bucket >= 0) months[bucket].count += 1;
  }

  const totalEmpresas = rows.length;
  const formatPct = (value: number): string =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const percentOf = (value: number): string =>
    totalEmpresas > 0 ? formatPct((value / totalEmpresas) * 100) : "0,00";

  const totalProdutos = Array.from(productCounts.values()).reduce(
    (sum, value) => sum + value,
    0
  );
  const percentProduct = (value: number): string =>
    totalProdutos > 0 ? formatPct((value / totalProdutos) * 100) : "0,00";

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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVEL_CARDS.map((card) => (
              <Card key={card.level}>
                <CardHeader className={cn("rounded-t-lg pb-2", card.className)}>
                  <CardTitle className="text-sm font-semibold">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-3xl font-bold tabular-nums">
                    {counts[card.level]}
                  </div>
                  <CardDescription className="mt-1">
                    {percentOf(counts[card.level])}% do total de empresas
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CERTIFICATE_PRODUCTS.map((produto) => {
              const count = productCounts.get(produto) ?? 0;
              return (
                <Card key={produto}>
                  <CardHeader className="rounded-t-lg bg-muted/50 pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {produto}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="text-3xl font-bold tabular-nums">
                      {count}
                    </div>
                    <CardDescription className="mt-1">
                      {percentProduct(count)}% dos certificados
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Certificados a vencer nos próximos 12 meses
              </CardTitle>
              <CardDescription>
                Quantidade de certificados com vencimento em cada mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={months}
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      fontSize={11}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Certificados"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
